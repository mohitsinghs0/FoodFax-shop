import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;
  final EdgeInsetsGeometry padding;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize = 11,
    this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    switch (status.toLowerCase()) {
      case 'pending':
        bg = AppColors.statusPending.withOpacity(0.18);
        fg = AppColors.statusPending;
        label = 'PENDING';
        break;
      case 'accepted':
        bg = AppColors.primary.withOpacity(0.18);
        fg = AppColors.primary;
        label = 'ACCEPTED';
        break;
      case 'preparing':
        bg = AppColors.statusPreparing.withOpacity(0.18);
        fg = AppColors.statusPreparing;
        label = 'PREPARING';
        break;
      case 'ready':
        bg = AppColors.statusReady.withOpacity(0.18);
        fg = AppColors.statusReady;
        label = 'READY';
        break;
      case 'completed':
        bg = AppColors.statusCompleted.withOpacity(0.18);
        fg = AppColors.statusCompleted;
        label = 'COMPLETED';
        break;
      case 'cancelled':
        bg = AppColors.error.withOpacity(0.18);
        fg = AppColors.error;
        label = 'CANCELLED';
        break;
      default:
        bg = AppColors.surfaceLight;
        fg = AppColors.textSecondary;
        label = status.toUpperCase();
    }

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withOpacity(0.4), width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: fontSize,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
