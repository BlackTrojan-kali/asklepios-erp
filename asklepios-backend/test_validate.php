<?php
$req = App\Models\Laboratory\LabRequest::where('status', 'COMPLETED')->first();
if ($req) {
    echo 'Found request: ' . $req->id . "\n";
    $request = new Illuminate\Http\Request();
    $controller = new App\Http\Controllers\Laboratory\LabResultController();
    $response = $controller->validateResults($request, $req->id);
    echo $response->getContent();
} else {
    echo 'No COMPLETED requests found.';
}
