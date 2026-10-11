from django.core.management.base import BaseCommand
from students.models import Student
from enrollments.models import Enrollment


class Command(BaseCommand):
    help = 'Deletes students who have no enrollment (orphan/test data)'

    def handle(self, *args, **kwargs):
        enrolled_ids = set(Enrollment.objects.values_list('student_id', flat=True))
        orphans = Student.objects.exclude(id__in=enrolled_ids)
        count = orphans.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS("No orphan students found."))
            return

        self.stdout.write(f"Deleting {count} orphan student(s):")
        for s in orphans:
            self.stdout.write(f"  - {s.full_name} (id={s.id})")

        orphans.delete()
        self.stdout.write(self.style.SUCCESS(f"Done. {count} orphan student(s) deleted."))