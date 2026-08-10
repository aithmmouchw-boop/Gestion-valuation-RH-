<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY category ENUM('Employé','Technicien','Agent','Cadre','Cadre dirigeant','Manager') NOT NULL DEFAULT 'Cadre'");
    }

    public function down(): void
    {
        DB::table('users')->whereIn('category', ['Employé', 'Cadre dirigeant'])->update(['category' => 'Cadre']);
        DB::statement("ALTER TABLE users MODIFY category ENUM('Cadre','Manager','Technicien','Agent') NOT NULL DEFAULT 'Cadre'");
    }
};
