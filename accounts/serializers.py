from django.utils.text import slugify
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from organizations.models import Organization
from organizations.serializers import OrganizationSerializer
from roles_permissions.models import Role
from roles_permissions.serializers import RoleSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "first_name",
            "last_name",
            "organization",
            "roles",
            "is_owner",
            "is_staff",
            "is_active",
            "date_joined",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "is_owner",
            "is_staff",
            "is_active",
            "date_joined",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.email

    def get_roles(self, obj):
        roles = [user_role.role for user_role in obj.user_roles.select_related("role")]
        return RoleSerializer(roles, many=True).data


class UserCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(validators=[])
    password = serializers.CharField(write_only=True, min_length=8)
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "password",
            "is_owner",
            "is_staff",
            "role_ids",
        ]
        read_only_fields = ["id"]

    def validate_role_ids(self, roles):
        organization_id = self.context["request"].user.organization_id
        invalid_roles = [role.id for role in roles if role.organization_id != organization_id]
        if invalid_roles:
            raise serializers.ValidationError("All roles must belong to your organization.")
        return roles

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "This email already belongs to another organization and cannot be invited again."
            )
        return value

    def create(self, validated_data):
        roles = validated_data.pop("role_ids", [])
        request = self.context["request"]
        organization = request.user.organization
        password = validated_data.pop("password")
        user = User.objects.create_user(
            organization=organization,
            password=password,
            **validated_data,
        )
        if roles:
            from roles_permissions.models import UserRole

            UserRole.objects.bulk_create(
                [
                    UserRole(
                        organization=organization,
                        user=user,
                        role=role,
                    )
                    for role in roles
                ]
            )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "is_owner",
            "is_staff",
            "is_active",
            "role_ids",
        ]
        read_only_fields = ["id"]

    def validate_role_ids(self, roles):
        organization_id = self.context["request"].user.organization_id
        invalid_roles = [role.id for role in roles if role.organization_id != organization_id]
        if invalid_roles:
            raise serializers.ValidationError("All roles must belong to your organization.")
        return roles

    def update(self, instance, validated_data):
        roles = validated_data.pop("role_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if roles is not None:
            from roles_permissions.models import UserRole

            UserRole.objects.filter(user=instance).delete()
            UserRole.objects.bulk_create(
                [
                    UserRole(
                        organization=instance.organization,
                        user=instance,
                        role=role,
                    )
                    for role in roles
                ]
            )
        return instance


class OrganizationSignupSerializer(serializers.Serializer):
    organization_name = serializers.CharField(max_length=255)
    owner_email = serializers.EmailField()
    owner_password = serializers.CharField(write_only=True, min_length=8)
    owner_first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    owner_last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_owner_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "This email already belongs to another organization and cannot be used to create a new one."
            )
        return value

    def validate_organization_name(self, value):
        if not slugify(value):
            raise serializers.ValidationError("Enter a valid organization name.")
        return value

    def create(self, validated_data):
        organization = Organization.objects.create(name=validated_data["organization_name"])
        user = User.objects.create_user(
            email=validated_data["owner_email"],
            password=validated_data["owner_password"],
            organization=organization,
            first_name=validated_data.get("owner_first_name", ""),
            last_name=validated_data.get("owner_last_name", ""),
            is_owner=True,
            is_staff=True,
        )
        return {"organization": organization, "user": user}


class OrganizationSignupResponseSerializer(serializers.Serializer):
    organization = OrganizationSerializer(read_only=True)
    user = UserSerializer(read_only=True)


class CurrentUserSerializer(UserSerializer):
    permission_codes = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["permission_codes"]

    def get_permission_codes(self, obj):
        return obj.get_permission_codes()


class StartupOSTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["organization_id"] = user.organization_id
        token["is_owner"] = user.is_owner
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = CurrentUserSerializer(self.user).data
        return data
