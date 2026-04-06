from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        from django.db.models.signals import post_migrate

        from accounts.signals import bootstrap_admin_after_migrate

        post_migrate.connect(
            bootstrap_admin_after_migrate,
            sender=self,
            dispatch_uid="accounts.bootstrap_admin_after_migrate",
        )
