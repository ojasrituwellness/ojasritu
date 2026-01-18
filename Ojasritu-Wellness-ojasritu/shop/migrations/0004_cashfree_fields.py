from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0003_gurukulnotification'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='payment_method',
            field=models.CharField(
                choices=[('credit_card', 'क्रेडिट कार्ड'), ('debit_card', 'डेबिट कार्ड'), ('upi', 'UPI'), ('wallet', 'डिजिटल वॉलेट'), ('cod', 'नकद'), ('cashfree', 'Cashfree')],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='order',
            name='payment_status',
            field=models.CharField(
                choices=[('pending', 'PENDING'), ('paid', 'PAID'), ('failed', 'FAILED')],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='cashfree_order_id',
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name='order',
            name='cashfree_payment_session_id',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='order',
            name='cart_snapshot',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
