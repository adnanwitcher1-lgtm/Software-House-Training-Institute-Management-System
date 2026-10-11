from rest_framework import serializers
from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'status', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by']