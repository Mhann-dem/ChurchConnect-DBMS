from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Count
from members.models import Member
from pledges.models import Pledge
from groups.models import Group

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        stats = {
            'members': {
                'total': Member.objects.count(),
                'active': Member.objects.filter(is_active=True).count(),
                'by_gender': dict(Member.objects.values('gender').annotate(count=Count('id'))),
                'new_this_month': Member.objects.filter(
                    registration_date__month=timezone.now().month,
                    registration_date__year=timezone.now().year
                ).count(),
            },
            'pledges': {
                'total_amount': Pledge.objects.filter(status='active').aggregate(total=Sum('amount'))['total'] or 0,
                'active_count': Pledge.objects.filter(status='active').count(),
                'by_frequency': dict(Pledge.objects.values('frequency').annotate(count=Count('id'))),
            },
            'groups': {
                'total': Group.objects.count(),
                'active': Group.objects.filter(active=True).count(),
                'by_type': dict(Group.objects.values('group_type').annotate(count=Count('id'))),
            }
        }
        return Response(stats)