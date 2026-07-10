<?php
$roles = \App\Models\Role::all();
echo json_encode($roles);
