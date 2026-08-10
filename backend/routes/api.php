<?php

use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;

Route::any('/{path?}', ApiController::class)->where('path', '.*');
