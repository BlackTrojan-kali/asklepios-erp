<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    //
    protected $guarded = [];
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
