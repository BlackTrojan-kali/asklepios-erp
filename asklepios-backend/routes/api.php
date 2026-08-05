<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Imports de tes contrôleurs
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\ArticleCategoryController;
use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\BatchController;
use App\Http\Controllers\Admin\BedController;
use App\Http\Controllers\Admin\CenterController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\DoctorController;
use App\Http\Controllers\Admin\DriverController;
use App\Http\Controllers\Admin\FacilityRoomController;
use App\Http\Controllers\Admin\CashRegisterController;
use App\Http\Controllers\Admin\InsuranceCompanyController;
use App\Http\Controllers\Admin\PatientCoverageController;
use App\Http\Controllers\Admin\PaymentAccountController;
use App\Http\Controllers\Admin\PaymentTransactionController;
use App\Http\Controllers\Admin\PosSaleController as AdminPosSaleController;
use App\Http\Controllers\Pharmacien\CashRegisterSessionController;
use App\Http\Controllers\Pharmacien\PosSaleController;
use App\Http\Controllers\Pharmacien\PosSaleItemController;
use App\Http\Controllers\Pharmacien\CashierController;
use App\Http\Controllers\Admin\PharmacienController;
use App\Http\Controllers\Admin\PharmacyBranchArticleController;
use App\Http\Controllers\Admin\PharmacyBranchController;
use App\Http\Controllers\Admin\ProviderController;
use App\Http\Controllers\Admin\Reports\AdmissionHistoryController;
use App\Http\Controllers\Admin\Reports\ConsultationHistoryController;
use App\Http\Controllers\Admin\RoomCategoryController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\VehiculeController;
use App\Http\Controllers\BI\FinanceBIController;
use App\Http\Controllers\BI\HospitalActivityBIController;
use App\Http\Controllers\BI\HospitalFinanceBIController;
use App\Http\Controllers\BI\LabActivityBIController;
use App\Http\Controllers\BI\PharmacyBIController;
use App\Http\Controllers\BI\StockBIController;
use App\Http\Controllers\Doctor\ConsultationController;
use App\Http\Controllers\Doctor\PdfController as DoctorPdfController;
use App\Http\Controllers\Doctor\EquipmentController;
use App\Http\Controllers\Doctor\MedicalActCatalogController;
use App\Http\Controllers\Doctor\MedicalBackgroundController;
use App\Http\Controllers\Hospital\AdmissionController;
use App\Http\Controllers\Hospital\BagCenterController;
use App\Http\Controllers\Hospital\BloodBagController;
use App\Http\Controllers\Hospital\BloodDonorController;
use App\Http\Controllers\Hospital\BloodRefrigeratorController;
use App\Http\Controllers\Hospital\BloodTrackingController;
use App\Http\Controllers\Hospital\BloodTransfusionController;
use App\Http\Controllers\Hospital\FinancialReportController;
use App\Http\Controllers\Hospital\GuarantorClaimController;
use App\Http\Controllers\Hospital\InvoiceController;
use App\Http\Controllers\Hospital\PaymentController;
use App\Http\Controllers\Laboratory\LabRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Pharmacien\InventoryController;
use App\Http\Controllers\Pharmacien\PurchaseOrderController;
use App\Http\Controllers\Pharmacien\PurchaseReturnController;
use App\Http\Controllers\Pharmacien\StockMovementController;
use App\Http\Controllers\Pharmacien\StockTransferController;
use App\Http\Controllers\Pharmacien\StorageLocationController;
use App\Http\Controllers\Receptionist\AppointmentController;
use App\Http\Controllers\SUPA\AdminController;
use App\Http\Controllers\SUPA\CountryController;
use App\Http\Controllers\SUPA\HospitalController;
use App\Http\Controllers\SUPA\LicenceController;
use App\Http\Controllers\SUPA\ProfileCeoController;
use App\Http\Controllers\SUPA\SubscriptionController;
use GuzzleHttp\Middleware;

// ==========================================================
// 1. AUTHENTIFICATION (PUBLIC)
// ==========================================================
Route::prefix("auth")->group(function () {
    Route::post("/login", [AuthController::class, "login"]);
    Route::post("/logout", [AuthController::class, "logout"])->middleware("auth:sanctum");
});

// ==========================================================
// 2. ROUTES AUTHENTIFIÉES (GLOBALES)
// ==========================================================
Route::middleware('auth:sanctum')->group(function () {
    
    // --- 2.1. INFORMATIONS GLOBALES & UTILISATEUR ---
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::get('admin/centers', [CenterController::class, 'index']); // (Exposé à tous les connectés)
    Route::get('/subscriptions/my-remaining-days', [SubscriptionController::class, 'myRemainingDays']);
    
    Route::prefix('countries')->group(function () {
        Route::get('/all', [CountryController::class, 'all']);
        Route::get('/', [CountryController::class, 'index']);
        Route::get('/{id}', [CountryController::class, 'show']);
    });

    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });

    // --- 2.2. ASSURANCES ET GARANTS (Hors Licences spécifiques) ---
    Route::get('insurance-coverages/patient/{patient_id}', [PatientCoverageController::class, 'getPatientCoverages']);
    
    Route::middleware(['role:admin,reception,ceo,doctor'])->group(function () {
        Route::post('insurance-coverages', [PatientCoverageController::class, 'store']);
        Route::put('insurance-coverages/{id}', [PatientCoverageController::class, 'update']);
        Route::delete('insurance-coverages/{id}', [PatientCoverageController::class, 'destroy']);
        
        Route::prefix('admin')->group(function () {
            Route::apiResource('insurance-companies', InsuranceCompanyController::class)->except(['show']);
            // 👉 ROUTES : BANQUE DE SANG (Réfrigérateurs)
        Route::apiResource('blood-refrigerators', BloodRefrigeratorController::class);
        // 👉 ROUTES : BANQUE DE SANG (Donneurs)
        Route::get('blood-donors/export', [BloodDonorController::class, 'export']);
        Route::post('blood-donors/import', [BloodDonorController::class, 'import']);
        Route::apiResource('blood-donors', BloodDonorController::class);
        // 👉 ROUTES : BANQUE DE SANG (Poches de sang & Stock)
        Route::get('blood-bags/export-pdf', [BloodBagController::class, 'exportPdf']);
        Route::apiResource('blood-bags', BloodBagController::class);
        Route::get('bag-pricings', [BagCenterController::class, 'index']);
        Route::post('bag-pricings', [BagCenterController::class, 'store']);
        });
    });
    // ==========================================================
        // 👉 SUIVI DES TRANSFUSIONS SANGUINES (Blood Tracking)
        // Accessible par les Admins, Docteurs, Réception et CEO
        // ==========================================================
        Route::middleware(['role:admin,doctor,reception,ceo'])->prefix('hospital/blood-tracking')->group(function () {
            Route::get('/', [BloodTrackingController::class, 'index']);
            Route::get('/export-pdf', [BloodTrackingController::class, 'exportPdf']);
        });
// GESTION DES TRANSFUSIONS (Docteur / Infirmière)
    Route::prefix('doctor')->middleware(['role:doctor|nurse'])->group(function () {
        Route::get('transfusions', [BloodTransfusionController::class, 'index']);
        Route::post('transfusions', [BloodTransfusionController::class, 'store']);
        Route::put('transfusions/{id}/finish', [BloodTransfusionController::class, 'finish']);
    });
    Route::middleware(['role:admin'])->prefix('shared')->group(function () {
        Route::prefix('guarantor-claims')->group(function () {
            Route::get('/export/pdf', [GuarantorClaimController::class, 'exportPdfList']);
            Route::get('/export/excel', [GuarantorClaimController::class, 'exportExcelList']);
            Route::get('/', [GuarantorClaimController::class, 'index']);
            Route::post('/', [GuarantorClaimController::class, 'store']);
            Route::get('/{id}', [GuarantorClaimController::class, 'show']);
            Route::put('/{id}', [GuarantorClaimController::class, 'update']);
            Route::delete('/{id}', [GuarantorClaimController::class, 'destroy']);
            Route::get('/{id}/download', [GuarantorClaimController::class, 'downloadPdf']);
        });
        Route::get('/invoice-splits/unclaimed', [GuarantorClaimController::class, 'getUnclaimedSplits']);
    });

    // ==========================================================
    // 3. SUPER ADMIN (Gestion SaaS)
    // ==========================================================
    Route::prefix('supa')->group(function () {
        // Accès partagé Super Admin, Admin, CEO
        Route::middleware(['role:super_admin,admin,ceo'])->group(function () {
            Route::apiResource('ceos', ProfileCeoController::class)->except(['show']);
            Route::patch('/admins/{id}/password', [AdminController::class, 'updatePassword']);
            Route::apiResource('admins', AdminController::class);
            Route::apiResource('hospitals', HospitalController::class);
        });

        // Accès exclusif Super Admin
        Route::middleware('role:super_admin')->group(function () {
            Route::post('/countries', [CountryController::class, 'store']);
            Route::put('/countries/{id}', [CountryController::class, 'update']);
            Route::apiResource('licences', LicenceController::class);

            Route::prefix('subscriptions')->group(function () {
                Route::get('/{id}/preview', [SubscriptionController::class, 'preview']);
                Route::patch('/{id}/renew', [SubscriptionController::class, 'renew']);
                Route::get('/{id}/invoice', [SubscriptionController::class, 'downloadInvoice']);
            });
            Route::apiResource('subscriptions', SubscriptionController::class);
        });
    });

    // ==========================================================
    // 4. BUSINESS INTELLIGENCE (BI)
    // ==========================================================
    Route::prefix('bi')->middleware(['role:ceo'])->group(function () {
    Route::prefix('/stock')->group(function () {
        Route::get('/kpis', [StockBIController::class, 'getKPIs']);
        Route::get('/valuation-by-category', [StockBIController::class, 'getValuationByCategory']);
        Route::get('/expiring-soon', [StockBIController::class, 'getExpiringSoon']);
        Route::get('/movement-trends', [StockBIController::class, 'getMovementTrends']);
        Route::get('/low-stock-details', [StockBIController::class, 'getLowStockDetails']);
    });

    // 👉 NOUVELLES ROUTES FINANCE
        Route::prefix('finance')->group(function () {
            Route::get('/kpis', [FinanceBIController::class, 'getKPIs']);
            Route::get('/revenue-trends', [FinanceBIController::class, 'getRevenueTrends']);
            Route::get('/revenue-by-payment-method', [FinanceBIController::class, 'getRevenueByPaymentMethod']);
            Route::get('/revenue-by-category', [FinanceBIController::class, 'getRevenueByCategory']);
            Route::get('/top-articles', [FinanceBIController::class, 'getTopArticles']);
            Route::get('/cash-flow', [FinanceBIController::class, 'getCashFlow']);
        });

      // 👉 NOUVELLES ROUTES ACTIVITÉS DE L'HÔPITAL
        Route::prefix('hospital')->group(function () {
            Route::get('/kpis', [HospitalActivityBIController::class, 'getKPIs']);
            Route::get('/visit-trends', [HospitalActivityBIController::class, 'getVisitTrends']);
            Route::get('/consultations-by-doctor', [HospitalActivityBIController::class, 'getConsultationsByDoctor']);
            Route::get('/top-medical-acts', [HospitalActivityBIController::class, 'getTopMedicalActs']);
            Route::get('/active-admissions', [HospitalActivityBIController::class, 'getActiveAdmissions']);
        }); 
        
        // 👉 NOUVELLES ROUTES : FINANCE DE L'HÔPITAL
        Route::prefix('hospital-finance')->group(function () {
            Route::get('/kpis', [HospitalFinanceBIController::class, 'getKPIs']);
            Route::get('/revenue-trends', [HospitalFinanceBIController::class, 'getRevenueTrends']);
            Route::get('/revenue-by-service', [HospitalFinanceBIController::class, 'getRevenueByService']);
            Route::get('/payment-methods', [HospitalFinanceBIController::class, 'getPaymentMethods']);
            Route::get('/insurance-claims', [HospitalFinanceBIController::class, 'getInsuranceClaims']);
        });
        // 👉 NOUVELLES ROUTES : ACTIVITÉS DU LABORATOIRE
        Route::prefix('laboratory')->group(function () {
            Route::get('/kpis', [LabActivityBIController::class, 'getKPIs']);
            Route::get('/request-trends', [LabActivityBIController::class, 'getRequestTrends']);
            Route::get('/top-tests', [LabActivityBIController::class, 'getTopTests']);
            Route::get('/revenue-by-category', [LabActivityBIController::class, 'getRevenueByCategory']);
            Route::get('/sample-quality', [LabActivityBIController::class, 'getSampleQuality']);
        });
    });

    Route::middleware(['role:ceo,admin', 'licence:pharmacy'])->prefix('ceo/bi/pharmacy')->group(function () {
        Route::get('/kpis', [PharmacyBIController::class, 'getGlobalKPIs']);
        Route::get('/sales-analytics', [PharmacyBIController::class, 'getSalesAnalytics']);
        Route::get('/inventory-valuation', [PharmacyBIController::class, 'getInventoryValuation']);
        Route::get('/minsante-compliance', [PharmacyBIController::class, 'getMinsanteCompliance']);
    });

    // ==========================================================
    // 5. LICENCE: BASE HOSPITAL (Hors Pharmacie/Labo)
    // ==========================================================
    Route::middleware(["licence:base_hospital"])->group(function () {
        
        Route::get('admin/centers/{center}', [CenterController::class, 'show']);

        // --- Accès Admin & CEO ---
        Route::middleware('role:admin,ceo')->prefix('admin')->group(function () {
            Route::apiResource('centers', CenterController::class)->except(['index', 'show']);
            Route::apiResource('departments', DepartmentController::class);
            Route::apiResource('receptionists', \App\Http\Controllers\Admin\ReceptionistController::class);
            Route::apiResource('facility-rooms', FacilityRoomController::class)->except(['index', 'show']);
        });

        // --- Accès Admin, Docteur, CEO ---
        Route::middleware(['role:admin,doctor,ceo'])->group(function () {
            Route::prefix('admin')->group(function () {
                Route::put('/payments/{id}', [PaymentController::class, 'update']);
                Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);
                Route::post('facility-rooms/sync-waiting-rooms', [FacilityRoomController::class, 'syncWaitingRooms']);
                Route::apiResource('room-categories', RoomCategoryController::class);
                Route::apiResource('beds', BedController::class)->except(['index', 'show']);
            });

            Route::prefix('shared/departments/{departmentId}')->group(function () {
                Route::post('medical-acts', [MedicalActCatalogController::class, 'store']);
                Route::put('medical-acts/{actId}', [MedicalActCatalogController::class, 'update']);
                Route::delete('medical-acts/{actId}', [MedicalActCatalogController::class, 'destroy']);
                
                Route::get('equipment/maintenance-alerts', [EquipmentController::class, 'maintenanceAlerts']);
                Route::apiResource('equipment', EquipmentController::class);
            });
        });

        // --- Accès Docteur ---
        Route::middleware(['role:doctor'])->prefix('doctor')->group(function () {
            Route::get('/consultations/{id}/prescription-pdf', [DoctorPdfController::class, 'downloadPrescriptionPdf']);
            Route::get('/consultations/{id}/exam-request-pdf', [DoctorPdfController::class, 'downloadExamRequestPdf']);
            Route::apiResource('consultations', ConsultationController::class);
        });

        // --- Accès Réception ---
        Route::middleware(['role:reception'])->prefix('reception')->group(function () {
            Route::get('doctors', [DoctorController::class, 'index']);
        });
    });

    // ==========================================================
    // 6. LICENCE PARTAGÉE : PHARMACY & BASE HOSPITAL
    // ==========================================================
    Route::middleware(["licence:pharmacy,base_hospital"])->group(function () {
        Route::middleware('role:admin,doctor,pharmacy,ceo')->prefix('admin')->group(function () {
            Route::get('articles/all', [ArticleController::class, 'all']);
        });
    });

    // ==========================================================
    // 7. LICENCE: PHARMACY
    // ==========================================================
    Route::middleware(['licence:pharmacy'])->group(function () {
        
        // --- 7.1. Accès Admin & CEO ---
        Route::middleware('role:admin,ceo')->prefix('admin')->group(function () {
            Route::prefix('reports')->group(function () {
                Route::get('/consultations', [ConsultationHistoryController::class, 'index']);
                Route::get('/consultations/export/pdf', [ConsultationHistoryController::class, 'exportPdf']);
                Route::get('/admissions', [AdmissionHistoryController::class, 'index']);
                Route::get('/admissions/export/pdf', [AdmissionHistoryController::class, 'exportPdf']);
            });

            Route::get('/facility-rooms/{id}/waiting-patients', [FacilityRoomController::class, 'getPatientsInWaitingRoom']);
            Route::apiResource('doctors', DoctorController::class);
            Route::apiResource('pharmacy-branches', PharmacyBranchController::class);
            Route::apiResource('cash-registers', CashRegisterController::class)->only(['store', 'update', 'destroy']);
            Route::apiResource('payment-accounts', PaymentAccountController::class);
            
            Route::prefix('payment-transactions')->group(function () {
                Route::post('/{id}/confirm', [PaymentTransactionController::class, 'confirm']);
                Route::post('/{id}/cancel', [PaymentTransactionController::class, 'cancel']);
            });
            Route::apiResource('payment-transactions', PaymentTransactionController::class);

            Route::prefix('article-categories')->group(function () {
                Route::get('/all', [ArticleCategoryController::class, 'all']);
            });
            Route::apiResource('article-categories', ArticleCategoryController::class);

            Route::prefix('articles')->group(function () {
                Route::get('/export/pdf', [ArticleController::class, 'exportPdf']);
            });
            Route::apiResource('articles', ArticleController::class)->only(['store', 'update', 'destroy']);

            Route::prefix('batches')->group(function () {
                Route::get('/all', [BatchController::class, 'all']);
                Route::post('/initialize-all-stocks', [BatchController::class, 'initializeAllStocks']);
                Route::post('/{id}/initialize-stock', [BatchController::class, 'initializeBatchStock']);
            });
            Route::apiResource('batches', BatchController::class);
            
            Route::get('/stocks/global', [StockController::class, 'getGlobalStocks']);

            Route::prefix('vehicules')->group(function () {
                Route::get('/export/excel', [VehiculeController::class, 'exportExcel']);
                Route::post('/import', [VehiculeController::class, 'importExcel']);
            });
            Route::apiResource('vehicules', VehiculeController::class);

            Route::prefix('drivers')->group(function () {
                Route::get('/export/excel', [DriverController::class, 'exportExcel']);
                Route::post('/import', [DriverController::class, 'importExcel']);
            });

            Route::prefix('stock-transfers')->group(function () {
                Route::get('/', [StockTransferController::class, 'index']);
                Route::get('/export/pdf', [StockTransferController::class, 'exportPdf']);
            });
        });

        // --- 7.2. Accès Partagé Admin, Pharmacy, CEO ---
        Route::middleware('role:admin,pharmacy,ceo')->group(function () {
            Route::get('/pharmacy/pos-sales/{id}/pdf', [PosSaleController::class, 'exportPdf']);
            
            Route::prefix('admin')->group(function () {
                Route::apiResource('drivers', DriverController::class); // Le CRUD global driver
                
                Route::get('/pharmacy-branches', [PharmacyBranchController::class, 'index']);
                Route::get('/pharmacy-branches/{id}', [PharmacyBranchController::class, 'show']);
                Route::get('/vehicules', [VehiculeController::class, 'index']);
                Route::get('/requests/{id}', [LabRequestController::class, 'show']);
                Route::get('/articles', [ArticleController::class, 'index']);
                
                Route::prefix('stock-movements')->group(function () {
                    Route::get('/export/pdf', [StockMovementController::class, 'exportPdf']);
                    Route::get('/export/excel', [StockMovementController::class, 'exportExcel']);
                    Route::get('/', [StockMovementController::class, 'index']);
                });

                Route::prefix('pharmaciens')->group(function () {
                    Route::get('/paginated', [PharmacienController::class, 'indexPaginated']);
                });
                Route::apiResource('pharmaciens', PharmacienController::class);

                Route::prefix('providers')->group(function () {
                    Route::get('/paginated', [ProviderController::class, 'indexPaginated']);
                    Route::get('/export/pdf', [ProviderController::class, 'exportPdf']);
                    Route::get('/export/excel', [ProviderController::class, 'exportExcel']);
                    Route::post('/import', [ProviderController::class, 'importExcel']);
                });
                Route::apiResource('providers', ProviderController::class)->except(['show']);

                Route::prefix('purchase-orders')->group(function () {
                    Route::get('/export/pdf', [PurchaseOrderController::class, 'exportPdf']);
                    Route::get('/export/excel', [PurchaseOrderController::class, 'exportExcel']);
                    Route::post('/{id}/cancel', [PurchaseOrderController::class, 'cancelOrder']);
                    Route::post('/{id}/validate', [PurchaseOrderController::class, 'validateOrder']);
                    Route::get('/{id}/pdf', [PurchaseOrderController::class, 'downloadOrderForm']);
                });
                Route::apiResource('purchase-orders', PurchaseOrderController::class);

                Route::prefix('purchase-returns')->group(function () {
                    Route::get('/export/pdf', [PurchaseReturnController::class, 'exportPdf']);
                    Route::get('/export/excel', [PurchaseReturnController::class, 'exportExcel']);
                    Route::post('/{id}/cancel', [PurchaseReturnController::class, 'cancelReturn']);
                    Route::post('/{id}/validate', [PurchaseReturnController::class, 'validateReturn']);
                });
                Route::apiResource('purchase-returns', PurchaseReturnController::class);

                Route::get('/stock-transfers/{id}/waybill', [StockTransferController::class, 'downloadWaybill']);

                Route::prefix('branch')->group(function () {
                    Route::prefix('articles')->group(function () {
                        Route::get('/export/excel', [PharmacyBranchArticleController::class, 'exportExcel']);
                        Route::get('/export/pdf', [PharmacyBranchArticleController::class, 'exportPdf']);
                        Route::get('/', [PharmacyBranchArticleController::class, 'index']);
                        Route::post('/update-price', [PharmacyBranchArticleController::class, 'updatePrice']);
                    });
                    Route::get('/{id}/articles/all', [PharmacyBranchArticleController::class, 'all']);
                    Route::get('/{id}/articles/', [PharmacyBranchArticleController::class, 'show']); 
                });

                Route::prefix('cash-registers')->group(function () {
                    Route::get('/', [CashRegisterController::class, 'index']);
                    Route::get('/sessions/history', [CashRegisterController::class, 'sessions']);
                    Route::get('/{id}', [CashRegisterController::class, 'show']);
                });

                Route::prefix('pharmacy/pos-sales')->group(function () {
                    Route::get('/export/pdf', [AdminPosSaleController::class, 'exportPdf']);
                    Route::get('/export/excel', [AdminPosSaleController::class, 'exportExcel']);
                    Route::get('/', [AdminPosSaleController::class, 'index']);
                    Route::get('/sellers', [AdminPosSaleController::class, 'sellers']);
                });
            });

            Route::prefix('pharmacy/inventories')->group(function () {
                Route::get('/export/pdf', [InventoryController::class, 'exportPdf']);
                Route::get('/export/excel', [InventoryController::class, 'exportExcel']);
                Route::post('/{id}/validate', [InventoryController::class, 'validateInventory']);
            });
            Route::apiResource('pharmacy/inventories', InventoryController::class);
        });

        // --- 7.3. Accès Exclusif Pharmacien ---
        Route::middleware('role:pharmacy')->prefix('pharmacy')->group(function () {
            Route::get('/stocks/my-branch', [StockController::class, 'getMyBranchStocks']);
            Route::post('/storage-locations/assign-stock', [StorageLocationController::class, 'assignToStock']);
            Route::apiResource('storage-locations', StorageLocationController::class)->except(['show']);

            Route::prefix('stock-transfers')->group(function () {
                Route::get('/', [StockTransferController::class, 'index']);
                Route::post('/', [StockTransferController::class, 'store']);
                Route::post('/{id}/receive', [StockTransferController::class, 'receive']);
                Route::post('/{id}/cancel', [StockTransferController::class, 'cancel']);
                Route::get('/export/pdf', [StockTransferController::class, 'exportPdf']);
            });

            Route::prefix('cash-registers')->group(function () {
                Route::post('/{id}/sessions/open', [CashRegisterSessionController::class, 'openSession']);
                Route::post('/sessions/{sessionId}/close', [CashRegisterSessionController::class, 'closeSession']);
                Route::get('/active-session/me', [CashRegisterSessionController::class, 'myActiveSession']);
                Route::get('/sessions/history', [CashRegisterSessionController::class, 'sessionHistory']);
            });

            Route::apiResource('pos-sales', PosSaleController::class)->only(['index', 'show']);
            Route::apiResource('pos-sale-items', PosSaleItemController::class)->only(['index']);
            Route::get('cashier/articles', [CashierController::class, 'getAllArticles']);

            Route::get('payment-accounts', [PaymentAccountController::class, 'index']);
            Route::get('payment-transactions', [PaymentTransactionController::class, 'index']);

            Route::middleware('active.session')->group(function () {
                Route::post('pos-sales', [PosSaleController::class, 'store']);
                Route::post('payment-transactions', [PaymentTransactionController::class, 'store']);
            });
        });
    }); // Fin Licence Pharmacie

    // ==========================================================
    // 8. LICENCE PARTAGÉE : BASE HOSPITAL & LABORATORY
    // ==========================================================
    Route::middleware(['licence:base_hospital,laboratory'])->group(function () {
        
        Route::middleware(["role:admin,doctor,reception,laboratory,ceo"])->prefix('shared')->group(function () {
            
            Route::prefix('patients/{patientId}')->group(function () {
                Route::get('medical-background', [MedicalBackgroundController::class, 'show']);
                Route::post('medical-background', [MedicalBackgroundController::class, 'store']);
                Route::put('medical-background', [MedicalBackgroundController::class, 'update']);
                Route::delete('medical-background', [MedicalBackgroundController::class, 'destroy']);
                Route::get('medical-record/download', [MedicalBackgroundController::class, 'downloadMedicalRecord']);
                Route::get('appointments', [AppointmentController::class, 'patientAppointments']);
                Route::get('/unbilled-preview', [InvoiceController::class, 'previewUnbilledForPatient']);
                Route::post('/generate-invoice', [InvoiceController::class, 'generateForPatient']);
            });

            Route::prefix('visits/{visitId}')->group(function () {
                Route::get('/unbilled-preview', [InvoiceController::class, 'previewUnbilled']);
                Route::post('/generate-invoice', [InvoiceController::class, 'generateForVisit']);
            });
            Route::patch('visits/{visit}/consultation', [AppointmentController::class, 'admitToConsultation']);

            Route::get('departments/{departmentId}/facility-rooms', [FacilityRoomController::class, 'index']);
            
            Route::prefix('departments/{departmentId}')->group(function () {
                Route::get('medical-acts', [MedicalActCatalogController::class, 'index']);
                Route::get('medical-acts/{actId}', [MedicalActCatalogController::class, 'show']);
            });

            Route::prefix('reports')->group(function () {
                Route::get('/payments-pdf', [FinancialReportController::class, 'exportPaymentsReport']);
                Route::get('/invoices-pdf', [FinancialReportController::class, 'exportInvoicesReport']);
                Route::get('/finance', [FinancialReportController::class, 'generateReport']);
            });

            Route::apiResource('payments', PaymentController::class)->only(['index', 'store']);

            Route::prefix('invoices')->group(function () {
                Route::get('/', [InvoiceController::class, 'index']);
                Route::get('/{id}', [InvoiceController::class, 'show']);
                Route::put('/{id}', [InvoiceController::class, 'update']);
                Route::delete('/{id}', [InvoiceController::class, 'destroy']);
                Route::get('/{id}/download', [InvoiceController::class, 'downloadPdf']);
            });

            Route::prefix('admissions')->group(function () {
                Route::get('/', [AdmissionController::class, 'index']);
                Route::post('/', [AdmissionController::class, 'store']);
                Route::patch('/{id}/discharge', [AdmissionController::class, 'discharge']);
            });

            Route::prefix('appointments')->group(function () {
                Route::get('/export-pdf', [AppointmentController::class, 'exportPdf']);
                Route::get('/export-history-pdf', [AppointmentController::class, 'exportHistoryPdf']);
                Route::put('/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
                Route::patch('/{appointment}/cancel', [AppointmentController::class, 'cancel']);
                Route::post('/{appointment}/admit', [AppointmentController::class, 'admitToWaitingRoom']);
            });
            Route::apiResource('appointments', AppointmentController::class)->except(['destroy', 'show']);

            Route::get('room-categories', [RoomCategoryController::class, 'index']);
            Route::get('rooms/{roomId}/beds', [BedController::class, 'index']);
        });

        Route::middleware(["role:admin,reception,doctor,pharmacy,laboratory,ceo"])->prefix('receptionist')->group(function () {
            Route::apiResource('patients', \App\Http\Controllers\Receptionist\PatientController::class);
        });
    }); // Fin Licence Base Hospital, Laboratory

    // ==========================================================
    // 9. LICENCE: LABORATORY (SIL)
    // ==========================================================
    Route::middleware(['licence:laboratory'])->group(function () {
        
        Route::middleware(['role:admin,ceo'])->prefix('admin')->group(function () {
            Route::apiResource('lab-personnel', App\Http\Controllers\Admin\LabPersonnelController::class);
        });

        Route::apiResource('laboratories', App\Http\Controllers\Laboratory\LaboratoryController::class);

        Route::prefix('laboratory')->group(function () {
            Route::apiResource('categories', App\Http\Controllers\Laboratory\LabCategoryController::class);
            Route::apiResource('tests', App\Http\Controllers\Laboratory\LabTestController::class);
            Route::apiResource('parameters', App\Http\Controllers\Laboratory\LabParameterController::class);

            Route::prefix('requests')->group(function () {
                Route::get('/', [App\Http\Controllers\Laboratory\LabRequestController::class, 'index']);
                Route::post('/', [App\Http\Controllers\Laboratory\LabRequestController::class, 'store']);
                Route::get('/{id}', [App\Http\Controllers\Laboratory\LabRequestController::class, 'show']);
                Route::post('/{id}/sample', [App\Http\Controllers\Laboratory\LabRequestController::class, 'markAsSampled']);
                Route::post('/{id}/results', [\App\Http\Controllers\Laboratory\LabResultController::class, 'saveResults']);
                Route::post('/{id}/validate', [\App\Http\Controllers\Laboratory\LabResultController::class, 'validateResults']);
                Route::get('/{id}/pdf', [\App\Http\Controllers\Laboratory\LabResultController::class, 'generatePdf']);
            });
        });
    });

}); // Fin Middleware Auth:Sanctum