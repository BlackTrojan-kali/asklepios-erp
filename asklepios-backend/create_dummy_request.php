<?php
$patient = App\Models\Patient::first();
$center = App\Models\Center::first();

if (!$patient || !$center) {
    echo "No patient or center found.";
    exit;
}

$category = App\Models\Laboratory\LabCategory::firstOrCreate(['name' => 'General']);

$test1 = App\Models\Laboratory\LabTest::firstOrCreate(
    ['code' => 'NFS'],
    ['lab_category_id' => $category->id, 'name' => 'NFS', 'sample_type_required' => 'Tube EDTA', 'price' => 5000, 'is_active' => true]
);

$test2 = App\Models\Laboratory\LabTest::firstOrCreate(
    ['code' => 'GLY'],
    ['lab_category_id' => $category->id, 'name' => 'Glycemie', 'sample_type_required' => 'Tube Sec', 'price' => 2000, 'is_active' => true]
);

$req = App\Models\Laboratory\LabRequest::create([
    'patient_id' => $patient->id,
    'center_id' => $center->id,
    'status' => 'PAID',
    'priority' => 'ROUTINE'
]);

App\Models\Laboratory\LabRequestLine::create(['lab_request_id' => $req->id, 'lab_test_id' => $test1->id]);
App\Models\Laboratory\LabRequestLine::create(['lab_request_id' => $req->id, 'lab_test_id' => $test2->id]);

echo 'Created LabRequest: ' . $req->id . "\n";
