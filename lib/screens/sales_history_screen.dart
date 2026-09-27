import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/order_provider.dart';
import '../theme/app_colors.dart';

class SalesHistoryScreen extends StatelessWidget {
  const SalesHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final completedOrders = orderProvider.orders.where((o) => o.status == 'completed').toList();
    final totalRevenue = completedOrders.fold<double>(0, (sum, o) => sum + o.totalAmount);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Sales & Revenue Analytics'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Total Revenue Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF059669), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'TOTAL SETTLED SALES',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Colors.white70,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '₹${totalRevenue.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'From ${completedOrders.length} completed customer orders',
                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Mini Sales Bar Chart
          Card(
            color: AppColors.surface,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Order Volume Overview',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 160,
                    child: BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        maxY: 20,
                        barTouchData: BarTouchData(enabled: false),
                        titlesData: FlTitlesData(
                          show: true,
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (val, meta) {
                                switch (val.toInt()) {
                                  case 0:
                                    return const Text('Pending', style: TextStyle(fontSize: 10, color: AppColors.textMuted));
                                  case 1:
                                    return const Text('Prep', style: TextStyle(fontSize: 10, color: AppColors.textMuted));
                                  case 2:
                                    return const Text('Ready', style: TextStyle(fontSize: 10, color: AppColors.textMuted));
                                  case 3:
                                    return const Text('Done', style: TextStyle(fontSize: 10, color: AppColors.textMuted));
                                }
                                return const SizedBox.shrink();
                              },
                            ),
                          ),
                          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        ),
                        borderData: FlBorderData(show: false),
                        barGroups: [
                          BarChartGroupData(
                            x: 0,
                            barRods: [BarChartRodData(toY: orderProvider.pendingCount.toDouble(), color: AppColors.statusPending, width: 22, borderRadius: BorderRadius.circular(6))],
                          ),
                          BarChartGroupData(
                            x: 1,
                            barRods: [BarChartRodData(toY: orderProvider.preparingCount.toDouble(), color: AppColors.statusPreparing, width: 22, borderRadius: BorderRadius.circular(6))],
                          ),
                          BarChartGroupData(
                            x: 2,
                            barRods: [BarChartRodData(toY: orderProvider.readyCount.toDouble(), color: AppColors.statusReady, width: 22, borderRadius: BorderRadius.circular(6))],
                          ),
                          BarChartGroupData(
                            x: 3,
                            barRods: [BarChartRodData(toY: orderProvider.completedCount.toDouble(), color: AppColors.success, width: 22, borderRadius: BorderRadius.circular(6))],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Completed Orders List
          const Text(
            'Settled Orders Log',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 10),

          if (completedOrders.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 30),
              child: const Center(
                child: Text('No settled orders yet', style: TextStyle(color: AppColors.textMuted)),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: completedOrders.length,
              itemBuilder: (context, index) {
                final order = completedOrders[index];
                final dateStr = DateFormat('dd MMM, hh:mm a').format(order.createdAt);
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  color: AppColors.surface,
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: AppColors.surfaceLight,
                      child: Icon(Icons.done_all, color: AppColors.success, size: 18),
                    ),
                    title: Text('#${order.orderNumber} - ${order.customerName}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: Text(dateStr, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    trailing: Text(
                      '₹${order.totalAmount.toStringAsFixed(0)}',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.success),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
