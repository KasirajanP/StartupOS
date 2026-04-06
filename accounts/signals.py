from accounts.bootstrap import bootstrap_admin_from_settings


def bootstrap_admin_after_migrate(sender, **kwargs):
    bootstrap_admin_from_settings()
