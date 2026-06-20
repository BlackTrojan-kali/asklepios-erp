<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    //
    protected $guarded = [];
    
    protected $casts = [
        'starting_date' => 'datetime',
        'ending_date' => 'datetime',
    ];

    // ... tes autres relations (hospital, country) ...

    /**
     * Les licences incluses dans cet abonnement (via la table subscription_items)
     */
    public function licences()
    {
        return $this->belongsToMany(Licence::class, 'subscription_items')
                    ->withPivot('unit_price')
                    ->withTimestamps();
    }
    // Une souscription contient plusieurs "items" (lignes de facturation)
    public function items()
    {
        return $this->hasMany(SubscriptionItem::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
    public function country()
    {
        return $this->belongsTo(Country::class);
    }
}
