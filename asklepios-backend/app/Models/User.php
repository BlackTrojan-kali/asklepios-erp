<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens; // <-- Corrigé ici (un seul Notifiable)

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'password',
        'role_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    
    public function role(){
        return $this->belongsTo(Role::class);
    }
    public function profile_super_admin(){
        return $this->hasOne(ProfileSuperAdmin::class);
    }
    public function profile_admin(){
        return $this->hasOne(ProfileAdmin::class);
    }
    public function profile_doctor(){
        return $this->hasOne(ProfileDoctor::class);
    }
    public function profile_pharm(){
        return $this->hasOne(ProfilePharm::class);
    }
    public function profile_lab(){
        return $this->hasOne(ProfileLab::class);
    }
    public function profile_reception(){
        return $this->hasOne(ProfileReception::class);
    }
}