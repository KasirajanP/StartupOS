from django.apps import AppConfig


class RequestsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'requests_app'
    label = 'requests'
    verbose_name = 'Requests'
