<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Notifications", description: "Gestion des notifications utilisateur")]
class NotificationController extends Controller
{
    /**
     * Récupère les notifications de l'utilisateur connecté
     */
    #[OA\Get(path: "/api/notifications", summary: "Lister les notifications", security: [["bearerAuth" => []]], tags: ["Notifications"])]
    #[OA\Response(response: 200, description: "Liste des notifications récupérée avec succès")]
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Paginé : on affiche d'abord les non lues (read_at = null), puis on trie par les plus récentes
        $notifications = $user->notifications()
            ->orderBy('read_at', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);
            
        // On récupère aussi le nombre exact de notifications non lues pour afficher sur la "cloche"
        $unreadCount = $user->unreadNotifications()->count();

        return response()->json([
            'data' => $notifications->items(),
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
            'total' => $notifications->total(),
            'unread_count' => $unreadCount
        ], 200);
    }

    /**
     * Récupérer uniquement le compteur de notifications non lues (pour un rafraîchissement léger)
     */
    #[OA\Get(path: "/api/notifications/unread-count", summary: "Compteur de notifications non lues", security: [["bearerAuth" => []]], tags: ["Notifications"])]
    #[OA\Response(response: 200, description: "Compteur récupéré avec succès")]
    public function unreadCount(Request $request)
    {
        $count = $request->user()->unreadNotifications()->count();
        
        return response()->json(['count' => $count], 200);
    }

    /**
     * Marquer une notification spécifique comme lue
     */
    #[OA\Patch(path: "/api/notifications/{id}/read", summary: "Marquer une notification comme lue", security: [["bearerAuth" => []]], tags: ["Notifications"])]
    #[OA\Response(response: 200, description: "Notification marquée comme lue")]
    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        
        // La méthode native de Laravel pour marquer comme lu (remplit la colonne read_at)
        $notification->markAsRead();

        return response()->json(['message' => 'Notification marquée comme lue.'], 200);
    }

    /**
     * Marquer TOUTES les notifications de l'utilisateur comme lues
     */
    #[OA\Post(path: "/api/notifications/read-all", summary: "Tout marquer comme lu", security: [["bearerAuth" => []]], tags: ["Notifications"])]
    #[OA\Response(response: 200, description: "Toutes les notifications ont été marquées comme lues")]
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Toutes vos notifications ont été marquées comme lues.'], 200);
    }
}