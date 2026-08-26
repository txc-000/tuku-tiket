<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_register_and_receives_a_token(): void
    {
        $response = $this->postJson('/api/register', [
            'full_name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'jane@example.com')
            ->assertJsonPath('user.role', 'user')
            ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com', 'role' => 'user']);
    }

    public function test_a_user_can_log_in_with_correct_credentials(): void
    {
        User::factory()->create(['email' => 'jane@example.com', 'password' => bcrypt('secret123')]);

        $response = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()->assertJsonStructure(['token', 'user']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'jane@example.com', 'password' => bcrypt('secret123')]);

        $response = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }

    public function test_me_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_me_endpoint_returns_the_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_admin_only_routes_reject_regular_users(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/events')
            ->assertStatus(403);
    }

    public function test_an_unauthenticated_request_without_an_accept_header_gets_a_clean_401(): void
    {
        // Regression test: plain `get()` (unlike getJson()) does NOT send
        // Accept: application/json — this is what a bare curl call or a
        // non-browser API client looks like. Without redirectGuestsTo(fn () =>
        // null) in bootstrap/app.php, Laravel's Authenticate middleware tries
        // route('login') for such requests (this app has no web login route)
        // and throws a RouteNotFoundException instead of returning 401.
        $this->get('/api/admin/events')->assertStatus(401);
    }

    public function test_admin_only_routes_allow_admins(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/events')
            ->assertOk();
    }
}
