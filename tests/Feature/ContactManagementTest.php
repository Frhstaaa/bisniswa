<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ContactManagementTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'PT Digital Sukses Mandiri',
            'slug' => 'digital-sukses-mandiri',
            'phone' => '+6281298430911',
        ]);

        $this->user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role' => 'client',
        ]);
    }

    public function test_contact_index_can_be_rendered(): void
    {
        $group = ContactGroup::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'VIP Pelanggan',
        ]);

        Contact::create([
            'workspace_id' => $this->workspace->id,
            'group_id' => $group->id,
            'name' => 'Budi Santoso',
            'phone' => '+6281234567890',
        ]);

        $response = $this->actingAs($this->user)->get(route('contacts.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Contacts/Index', false)
            ->has('contacts.data', 1)
            ->has('groups', 1)
        );
    }

    public function test_user_can_create_contact_with_custom_fields(): void
    {
        $group = ContactGroup::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Mahasiswa',
        ]);

        $response = $this->actingAs($this->user)->post(route('contacts.store'), [
            'name' => 'Ahmad Fauzi',
            'phone' => '081234567891',
            'group_id' => $group->id,
            'custom_fields' => [
                'jurusan' => 'Teknik Informatika',
                'tagihan' => 'Rp 500.000',
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('contacts', [
            'workspace_id' => $this->workspace->id,
            'name' => 'Ahmad Fauzi',
            'phone' => '+6281234567891',
            'group_id' => $group->id,
        ]);
    }

    public function test_user_can_update_contact(): void
    {
        $group = ContactGroup::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Grup A',
        ]);

        $contact = Contact::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Pelanggan 2467',
            'phone' => '+628386012467',
        ]);

        $response = $this->actingAs($this->user)->put(route('contacts.update', $contact->id), [
            'name' => 'Prabu Tiyas',
            'phone' => '08386012467',
            'group_id' => $group->id,
            'custom_fields' => [
                'kota' => 'Majalengka',
            ],
        ]);

        $response->assertRedirect();
        $contact->refresh();

        $this->assertEquals('Prabu Tiyas', $contact->name);
        $this->assertEquals('+628386012467', $contact->phone);
        $this->assertEquals($group->id, $contact->group_id);
        $this->assertEquals(['kota' => 'Majalengka'], $contact->custom_fields);
    }

    public function test_update_contact_prevents_duplicate_phone_in_same_workspace(): void
    {
        Contact::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Kontak Satu',
            'phone' => '+6281111111111',
        ]);

        $contact2 = Contact::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Kontak Dua',
            'phone' => '+6282222222222',
        ]);

        $response = $this->actingAs($this->user)->put(route('contacts.update', $contact2->id), [
            'name' => 'Kontak Dua Ganti Nomor',
            'phone' => '081111111111',
        ]);

        $response->assertSessionHasErrors(['phone']);
        $this->assertEquals('+6282222222222', $contact2->fresh()->phone);
    }

    public function test_user_can_delete_contact(): void
    {
        $contact = Contact::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Hapus Saya',
            'phone' => '+6289999999999',
        ]);

        $response = $this->actingAs($this->user)->delete(route('contacts.destroy', $contact->id));

        $response->assertRedirect();
        $this->assertDatabaseMissing('contacts', ['id' => $contact->id]);
    }

    public function test_user_can_create_update_and_delete_group(): void
    {
        // Store
        $response = $this->actingAs($this->user)->post(route('contacts.groups.store'), [
            'name' => 'Kategori Baru',
            'description' => 'Deskripsi Kategori',
        ]);
        $response->assertRedirect();
        $group = ContactGroup::where('name', 'Kategori Baru')->first();
        $this->assertNotNull($group);

        // Update
        $response = $this->actingAs($this->user)->put(route('contacts.groups.update', $group->id), [
            'name' => 'Kategori Diperbarui',
            'description' => 'Deskripsi Baru',
        ]);
        $response->assertRedirect();
        $this->assertEquals('Kategori Diperbarui', $group->fresh()->name);

        // Delete
        $response = $this->actingAs($this->user)->delete(route('contacts.groups.destroy', $group->id));
        $response->assertRedirect();
        $this->assertDatabaseMissing('contact_groups', ['id' => $group->id]);
    }
}
