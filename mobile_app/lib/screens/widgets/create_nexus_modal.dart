import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import '../screens/nexus_management_screen.dart';

class CreateNexusModal extends StatefulWidget {
  const CreateNexusModal({super.key});

  @override
  State<CreateNexusModal> createState() => _CreateNexusModalState();
}

class _CreateNexusModalState extends State<CreateNexusModal> {
  final ApiService _api = ApiService();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _bioController = TextEditingController();
  bool _isLoading = false;

  Future<void> _create() async {
    if (_nameController.text.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      final data = await _api.createNexusIdentity(
        _nameController.text,
        bio: _bioController.text,
      );
      
      final identityId = data['identityId'];
      final identity = await _api.getNexusIdentity(identityId);

      if (mounted) {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => NexusManagementScreen(identity: identity),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ في التكوين: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 32,
        right: 32,
        top: 32,
      ),
      decoration: const BoxDecoration(
        color: AppColors.blackDeep,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.greyDark,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'تكوين NEXUS ID',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.yellowWarm),
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'الاسم الظاهر'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _bioController,
            decoration: const InputDecoration(labelText: 'نبذة قصيرة'),
          ),
          const SizedBox(height: 48),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _create,
              child: _isLoading 
                ? const CircularProgressIndicator(color: AppColors.blackVoid)
                : const Text('تكوين المساحة الرقمية'),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
