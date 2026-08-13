<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            ['1', 'ouverture_campagne', 'Ouverture de Campagne', 'Notification automatique au lancement d une nouvelle campagne.', 'Immediat'],
            ['2', 'relances_automatiques', 'Relances Automatiques', 'Relances des evaluations en attente ou en retard.', 'Tous les 3 jours'],
            ['3', 'validation_evaluations', 'Validation des Evaluations', 'Notifications de validation, signature et correction des dossiers.', 'Immediat'],
            ['4', 'cloture_campagne', 'Cloture de Campagne', 'Notifications et rapports lors de la cloture.', 'A la cloture'],
            ['5', 'creation_compte', 'Creation de Compte', 'Envoi des identifiants temporaires aux nouveaux utilisateurs.', 'Immediat'],
            ['6', 'entretien_evaluation', 'Entretien d Evaluation', 'Notification des entretiens planifies, reportes ou annules.', 'Immediat'],
        ];

        foreach ($rows as [$id, $type, $label, $description, $frequency]) {
            DB::table('notification_configurations')->updateOrInsert(
                ['id' => $id],
                [
                    'type' => $type,
                    'label' => $label,
                    'description' => $description,
                    'enabled' => true,
                    'frequency' => $frequency,
                ]
            );
        }

        DB::table('notification_configurations')->update(['enabled' => true]);
    }

    public function down(): void
    {
        // Les notifications restent disponibles. Aucun retour destructif n'est applique.
    }
};
