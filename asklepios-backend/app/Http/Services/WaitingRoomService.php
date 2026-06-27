<?php

namespace App\Http\Services;

use App\Models\Department;
use App\Models\Hospital\FacilityRoom;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WaitingRoomService
{
    /**
     * 1. Crée les salles de base (Attente et Consultation) pour un département.
     * Retourne un tableau contenant les salles (existantes ou nouvellement créées).
     *
     * @param int $departmentId
     * @return array
     */
    public function createForDepartment(int $departmentId): array
    {
        $department = Department::findOrFail($departmentId);
        $rooms = [];

        // 1. Création ou récupération de la salle d'attente
        $rooms['waiting_room'] = FacilityRoom::firstOrCreate(
            [
                'department_id' => $department->id,
                'type'          => 'WAITING_ROOM',
            ],
            [
                'name'             => "Salle d'attente - " . $department->name,
                'room_category_id' => null,
            ]
        );

        // 2. Création ou récupération du bureau de consultation
        $rooms['consultation_room'] = FacilityRoom::firstOrCreate(
            [
                'department_id' => $department->id,
                'type'          => 'CONSULTATION',
            ],
            [
                'name'             => "Bureau de consultation - " . $department->name,
                'room_category_id' => null,
            ]
        );

        return $rooms;
    }

    /**
     * 2. Parcourt tous les départements d'un hôpital et crée les salles 
     * de base manquantes (Attente OU Consultation).
     *
     * @param int $hospitalId
     * @return int Le nombre total de salles créées lors de l'opération
     */
    public function createMissingForHospital(int $hospitalId): int
    {
        // On cible les départements qui n'ont PAS de salle d'attente OU PAS de salle de consultation
        $departmentsNeedingRooms = Department::whereHas('center', function ($query) use ($hospitalId) {
            $query->where('hospital_id', $hospitalId);
        })
        ->where(function ($query) {
            $query->whereDoesntHave('facilityRooms', function ($q) {
                $q->where('type', 'WAITING_ROOM');
            })->orWhereDoesntHave('facilityRooms', function ($q) {
                $q->where('type', 'CONSULTATION');
            });
        })
        ->get();

        $roomsCreatedCount = 0;

        DB::transaction(function () use ($departmentsNeedingRooms, &$roomsCreatedCount) {
            foreach ($departmentsNeedingRooms as $department) {
                
                // Vérification spécifique pour la Salle d'attente
                $waitingExists = FacilityRoom::where('department_id', $department->id)
                    ->where('type', 'WAITING_ROOM')
                    ->exists();

                if (!$waitingExists) {
                    FacilityRoom::create([
                        'department_id'    => $department->id,
                        'room_category_id' => null,
                        'name'             => "Salle d'attente - " . $department->name,
                        'type'             => 'WAITING_ROOM',
                    ]);
                    $roomsCreatedCount++;
                }

                // Vérification spécifique pour le Bureau de consultation
                $consultationExists = FacilityRoom::where('department_id', $department->id)
                    ->where('type', 'CONSULTATION')
                    ->exists();

                if (!$consultationExists) {
                    FacilityRoom::create([
                        'department_id'    => $department->id,
                        'room_category_id' => null,
                        'name'             => "Bureau de consultation - " . $department->name,
                        'type'             => 'CONSULTATION',
                    ]);
                    $roomsCreatedCount++;
                }
            }
        });

        if ($roomsCreatedCount > 0) {
            Log::info("WaitingRoomService: {$roomsCreatedCount} salles de base (attente et/ou consultation) générées pour l'hôpital ID {$hospitalId}.");
        }

        return $roomsCreatedCount;
    }
}