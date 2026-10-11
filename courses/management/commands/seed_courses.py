from django.core.management.base import BaseCommand
from courses.models import Course, Internship


class Command(BaseCommand):
    help = 'Seeds the 4 fixed courses with their internship components'

    def handle(self, *args, **kwargs):
        courses_data = [
            {
                'name': 'website_development',
                'description': 'Learn full-stack web development.',
                'duration_weeks': 12,
                'fee_amount': 25000,
                'internship_description': 'Live web-development tasks.',
            },
            {
                'name': 'graphic_designing',
                'description': 'Master design tools and principles.',
                'duration_weeks': 10,
                'fee_amount': 20000,
                'internship_description': 'Design production work.',
            },
            {
                'name': 'digital_marketing',
                'description': 'Learn campaigns, SEO and content marketing.',
                'duration_weeks': 8,
                'fee_amount': 18000,
                'internship_description': 'Campaign & content work.',
            },
            {
                'name': 'python_development',
                'description': 'Learn Python for real-world projects.',
                'duration_weeks': 14,
                'fee_amount': 28000,
                'internship_description': 'Python-based projects.',
            },
        ]

        for data in courses_data:
            course, created = Course.objects.get_or_create(
                name=data['name'],
                defaults={
                    'description': data['description'],
                    'duration_weeks': data['duration_weeks'],
                    'fee_amount': data['fee_amount'],
                    'status': 'active',
                }
            )
            Internship.objects.get_or_create(
                course=course,
                defaults={
                    'duration_weeks': 4,
                    'description': data['internship_description'],
                    'is_mandatory': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {course}"))
            else:
                self.stdout.write(f"Already exists: {course}")