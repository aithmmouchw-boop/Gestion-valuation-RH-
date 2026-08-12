<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mail:test {email}', function () {
    $email = (string) $this->argument('email');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $this->error('Adresse email invalide.');
        return 1;
    }
    Mail::html(
        '<div style="font-family:Arial;padding:24px"><h2 style="color:#065f46">Gestion Évaluation RH</h2><p>Votre configuration SMTP fonctionne correctement.</p><p>Les invitations, mots de passe temporaires et notifications peuvent maintenant être envoyés.</p></div>',
        fn ($message) => $message->to($email)->subject('Test SMTP réussi — Gestion Évaluation RH'),
    );
    $this->info('Email de test transmis au serveur SMTP pour '.$email);
    return 0;
})->purpose('Envoie un véritable email pour vérifier SMTP');

Artisan::command('users:reset-pending-passwords', function () {
    $temporary = (string) env('DEFAULT_TEMP_PASSWORD', 'Bienvenue#2026');
    $users = DB::table('users')->where('must_change_password', true)->get(['id', 'email']);
    foreach ($users as $user) {
        DB::table('users')->where('id', $user->id)->update(['password_hash' => Hash::make($temporary)]);
        $this->line(' - '.$user->email);
    }
    $this->info($users->count().' compte(s) en première connexion réinitialisé(s).');
})->purpose('Réinitialise seulement les comptes en attente avec le mot de passe temporaire par défaut');

Artisan::command('evaluations:repair-competence-ids', function () {
    $repaired = 0;
    DB::table('revue_annuel')->orderBy('id')->get()->each(function ($row) use (&$repaired) {
        $payload = json_decode($row->payload, true) ?: [];
        $competences = $payload['competences'] ?? [];
        if (count($competences) < 2) return;

        $ids = array_map(fn ($item) => (string) ($item['id'] ?? ''), $competences);
        if (count(array_unique($ids)) === count($ids)) return;

        $templates = DB::table('competence_templates as ct')
            ->join('fiches_evaluation as fe', 'fe.id', '=', 'ct.fiche_id')
            ->join('postes as p', 'p.id', '=', 'fe.poste_id')
            ->where('p.name', (string) ($payload['poste_name'] ?? ''))
            ->select('ct.id', 'ct.axe', 'ct.name')
            ->get()
            ->keyBy(fn ($item) => $item->axe.'|'.$item->name);

        foreach ($competences as $index => &$competence) {
            $template = $templates->get(($competence['axe'] ?? '').'|'.($competence['name'] ?? ''));
            $id = $template->id ?? (1000000000 + ((int) $row->id * 1000) + $index);
            $competence['id'] = (int) $id;
            $competence['competence_id'] = $template ? (int) $template->id : null;
        }
        unset($competence);
        $payload['competences'] = $competences;

        // Une auto-évaluation construite avec des identifiants dupliqués ne peut pas
        // distinguer les réponses. Elle est remise à saisir au lieu de conserver
        // artificiellement la même note pour tous les critères.
        if (!empty($payload['auto_evaluation'])) {
            $payload['auto_evaluation']['ratings'] = [];
            $payload['auto_evaluation']['comments'] = [];
            $payload['auto_evaluation']['submitted_at'] = null;
            if (($payload['status'] ?? $row->status) === 'auto_eval_terminee') {
                $payload['status'] = 'en_attente';
                DB::table('revue_annuel')->where('id', $row->id)->update(['status' => 'en_attente']);
            }
        }

        DB::table('revue_annuel')->where('id', $row->id)->update([
            'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
        ]);
        $repaired++;
        $this->line(' - Évaluation #'.$row->id.' : '.count($competences).' compétences réparées');
    });

    $this->info($repaired.' évaluation(s) réparée(s).');
})->purpose('Attribue un identifiant unique à chaque compétence des évaluations existantes');
