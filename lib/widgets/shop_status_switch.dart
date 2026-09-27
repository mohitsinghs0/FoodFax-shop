import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class ShopStatusSwitch extends StatelessWidget {
  final bool isOpen;
  final ValueChanged<bool> onChanged;

  const ShopStatusSwitch({
    super.key,
    required this.isOpen,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!isOpen),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isOpen ? AppColors.success.withOpacity(0.15) : AppColors.error.withOpacity(0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isOpen ? AppColors.success.withOpacity(0.5) : AppColors.error.withOpacity(0.5),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isOpen ? AppColors.success : AppColors.error,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              isOpen ? 'ONLINE' : 'OFFLINE',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: isOpen ? AppColors.success : AppColors.error,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
