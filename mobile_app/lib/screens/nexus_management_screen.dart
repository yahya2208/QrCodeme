import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/constants.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import 'nexus_identity_screen.dart';

class NexusManagementScreen extends StatefulWidget {
  final NexusIdentity identity;

  const NexusManagementScreen({super.key, required this.identity});

  @override
  State<NexusManagementScreen> createState() => _NexusManagementScreenState();
}

class _NexusManagementScreenState extends State<NexusManagementScreen> {
  final ApiService _api = ApiService();
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _nameController;
  late TextEditingController _bioController;
  late List<NexusLink> _links;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.identity.displayName);
    _bioController = TextEditingController(text: widget.identity.bio);
    _links = List.from(widget.identity.links);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  void _addLink() {
    setState(() {
      _links.add(NexusLink(label: 'رابط جديد', url: 'https://', type: 'external', icon: 'link'));
    });
  }

  void _removeLink(int index) {
    setState(() {
      _links.removeAt(index);
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      final formattedLinks = _links.map((l) => {
        'label': l.label,
        'url': l.url,
        'icon': l.icon,
        'type': l.type,
      }).toList();

      await _api.updateNexusIdentity(
        widget.identity.id,
        _nameController.text,
        bio: _bioController.text,
        links: formattedLinks,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تمت مزامنة الهوية سحابياً ✅')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ في المزامنة: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.blackVoid,
      appBar: AppBar(
        title: Text('إدارة المساحة الرقمية', style: GoogleFonts.outfit(fontSize: 16)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => NexusIdentityScreen(identityId: widget.identity.id)),
              );
            },
            icon: const Icon(Icons.remove_red_eye_outlined, color: AppColors.yellowWarm),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Visual Identity
              Center(
                child: ZoomIn(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.yellowNeon.withOpacity(0.3)),
                    ),
                    child: const Icon(Icons.auto_awesome, color: AppColors.yellowWarm, size: 40),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Basic Info
              _buildSectionTitle('المعلومات الأساسية'),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'الاسم الظاهر'),
                validator: (v) => v!.isEmpty ? 'مطلوب' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _bioController,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'الوصف أو النبذة'),
              ),

              const SizedBox(height: 40),

              // Links Management
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildSectionTitle('العناصر التفاعلية'),
                  TextButton.icon(
                    onPressed: _addLink,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('إضافة رابط'),
                    style: TextButton.styleFrom(foregroundColor: AppColors.yellowWarm),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ..._links.asMap().entries.map((entry) => _buildLinkEditor(entry.key, entry.value)),

              const SizedBox(height: 60),

              // Save Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.yellowWarm,
                    foregroundColor: AppColors.blackVoid,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                  ),
                  child: _isSaving
                      ? const CircularProgressIndicator(color: AppColors.blackVoid)
                      : const Text('مزامنة مع السحابة', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.outfit(
        color: AppColors.greyLight,
        fontSize: 12,
        letterSpacing: 2,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildLinkEditor(int index, NexusLink link) {
    return FadeInRight(
      child: Container(
        margin: const EdgeInsets.bottom(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.blackCarbon,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.blackCharcoal),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: link.label,
                    onChanged: (v) => _links[index] = NexusLink(label: v, url: _links[index].url, type: 'external', icon: 'link'),
                    decoration: const InputDecoration(hintText: 'عنوان الرابط', isDense: true),
                  ),
                ),
                IconButton(
                  onPressed: () => _removeLink(index),
                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: link.url,
              onChanged: (v) => _links[index] = NexusLink(label: _links[index].label, url: v, type: 'external', icon: 'link'),
              decoration: const InputDecoration(hintText: 'https://...', isDense: true),
            ),
          ],
        ),
      ),
    );
  }
}
