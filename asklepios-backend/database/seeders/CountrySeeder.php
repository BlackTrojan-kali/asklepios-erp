<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Country; // Assure-toi que ton modèle Country existe

class CountrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $countries = [
            ['name' => 'Afrique du Sud', 'code' => 'ZA', 'currency' => 'ZAR'],
            ['name' => 'Algérie', 'code' => 'DZ', 'currency' => 'DZD'],
            ['name' => 'Angola', 'code' => 'AO', 'currency' => 'AOA'],
            ['name' => 'Bénin', 'code' => 'BJ', 'currency' => 'XOF'],
            ['name' => 'Botswana', 'code' => 'BW', 'currency' => 'BWP'],
            ['name' => 'Burkina Faso', 'code' => 'BF', 'currency' => 'XOF'],
            ['name' => 'Burundi', 'code' => 'BI', 'currency' => 'BIF'],
            ['name' => 'Cameroun', 'code' => 'CM', 'currency' => 'XAF'],
            ['name' => 'Cap-Vert', 'code' => 'CV', 'currency' => 'CVE'],
            ['name' => 'République centrafricaine', 'code' => 'CF', 'currency' => 'XAF'],
            ['name' => 'Comores', 'code' => 'KM', 'currency' => 'KMF'],
            ['name' => 'République du Congo', 'code' => 'CG', 'currency' => 'XAF'],
            ['name' => 'République démocratique du Congo', 'code' => 'CD', 'currency' => 'CDF'],
            ['name' => 'Côte d\'Ivoire', 'code' => 'CI', 'currency' => 'XOF'],
            ['name' => 'Djibouti', 'code' => 'DJ', 'currency' => 'DJF'],
            ['name' => 'Égypte', 'code' => 'EG', 'currency' => 'EGP'],
            ['name' => 'Érythrée', 'code' => 'ER', 'currency' => 'ERN'],
            ['name' => 'Eswatini', 'code' => 'SZ', 'currency' => 'SZL'],
            ['name' => 'Éthiopie', 'code' => 'ET', 'currency' => 'ETB'],
            ['name' => 'Gabon', 'code' => 'GA', 'currency' => 'XAF'],
            ['name' => 'Gambie', 'code' => 'GM', 'currency' => 'GMD'],
            ['name' => 'Ghana', 'code' => 'GH', 'currency' => 'GHS'],
            ['name' => 'Guinée', 'code' => 'GN', 'currency' => 'GNF'],
            ['name' => 'Guinée-Bissau', 'code' => 'GW', 'currency' => 'XOF'],
            ['name' => 'Guinée équatoriale', 'code' => 'GQ', 'currency' => 'XAF'],
            ['name' => 'Kenya', 'code' => 'KE', 'currency' => 'KES'],
            ['name' => 'Lesotho', 'code' => 'LS', 'currency' => 'LSL'],
            ['name' => 'Liberia', 'code' => 'LR', 'currency' => 'LRD'],
            ['name' => 'Libye', 'code' => 'LY', 'currency' => 'LYD'],
            ['name' => 'Madagascar', 'code' => 'MG', 'currency' => 'MGA'],
            ['name' => 'Malawi', 'code' => 'MW', 'currency' => 'MWK'],
            ['name' => 'Mali', 'code' => 'ML', 'currency' => 'XOF'],
            ['name' => 'Maroc', 'code' => 'MA', 'currency' => 'MAD'],
            ['name' => 'Maurice', 'code' => 'MU', 'currency' => 'MUR'],
            ['name' => 'Mauritanie', 'code' => 'MR', 'currency' => 'MRU'],
            ['name' => 'Mozambique', 'code' => 'MZ', 'currency' => 'MZN'],
            ['name' => 'Namibie', 'code' => 'NA', 'currency' => 'NAD'],
            ['name' => 'Niger', 'code' => 'NE', 'currency' => 'XOF'],
            ['name' => 'Nigeria', 'code' => 'NG', 'currency' => 'NGN'],
            ['name' => 'Ouganda', 'code' => 'UG', 'currency' => 'UGX'],
            ['name' => 'Rwanda', 'code' => 'RW', 'currency' => 'RWF'],
            ['name' => 'Sao Tomé-et-Principe', 'code' => 'ST', 'currency' => 'STN'],
            ['name' => 'Sénégal', 'code' => 'SN', 'currency' => 'XOF'],
            ['name' => 'Seychelles', 'code' => 'SC', 'currency' => 'SCR'],
            ['name' => 'Sierra Leone', 'code' => 'SL', 'currency' => 'SLE'],
            ['name' => 'Somalie', 'code' => 'SO', 'currency' => 'SOS'],
            ['name' => 'Soudan', 'code' => 'SD', 'currency' => 'SDG'],
            ['name' => 'Soudan du Sud', 'code' => 'SS', 'currency' => 'SSP'],
            ['name' => 'Tanzanie', 'code' => 'TZ', 'currency' => 'TZS'],
            ['name' => 'Tchad', 'code' => 'TD', 'currency' => 'XAF'],
            ['name' => 'Togo', 'code' => 'TG', 'currency' => 'XOF'],
            ['name' => 'Tunisie', 'code' => 'TN', 'currency' => 'TND'],
            ['name' => 'Zambie', 'code' => 'ZM', 'currency' => 'ZMW'],
            ['name' => 'Zimbabwe', 'code' => 'ZW', 'currency' => 'ZWL'],
        ];

        foreach ($countries as $country) {
            Country::firstOrCreate(
                ['code' => $country['code']], // Critère d'unicité
                [
                    'name' => $country['name'],
                    'currency' => $country['currency'],
                ]
            );
        }
    }
}