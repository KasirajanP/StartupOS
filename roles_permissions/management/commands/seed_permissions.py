from django.core.management.base import BaseCommand

from roles_permissions.services import seed_default_permissions


class Command(BaseCommand):
    help = "Seed the default RBAC permission catalog for StartupOS."

    def handle(self, *args, **options):
        result = seed_default_permissions()
        self.stdout.write(self.style.SUCCESS("Permission catalog synced successfully."))
        self.stdout.write(f"Total permissions: {result['total']}")
        self.stdout.write(f"Created: {', '.join(result['created']) if result['created'] else 'None'}")
        self.stdout.write(f"Updated: {', '.join(result['updated']) if result['updated'] else 'None'}")
