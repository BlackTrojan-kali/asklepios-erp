<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionItem extends Model
{
    //
    protected $guarded = [];
    // Une ligne appartient à une souscription
    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    // Une ligne correspond à une licence spécifique
    public function licence()
    {
        return $this->belongsTo(Licence::class);
    }
}
