<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabTest extends Model
{
    use HasFactory;

    protected $fillable = ['lab_category_id', 'code', 'name', 'sample_type_required', 'price', 'is_active'];

    public function category()
    {
        return $this->belongsTo(LabCategory::class, 'lab_category_id');
    }

    public function parameters()
    {
        return $this->hasMany(LabParameter::class);
    }
}
