// Base de datos local de códigos postales de Estados Unidos
export interface ZipCodeData {
  zipCode: string;
  city: string;
  state: string;
  stateCode: string;
  county: string;
  latitude?: number;
  longitude?: number;
}

// Datos expandidos de códigos postales principales de Estados Unidos
export const ZIP_CODE_DATABASE: ZipCodeData[] = [
  // Florida
  { zipCode: '33101', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33102', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33109', city: 'Miami Beach', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33125', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33126', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33127', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33128', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33129', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33130', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33131', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33132', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33133', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33134', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33135', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33136', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33137', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33138', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33139', city: 'Miami Beach', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33140', city: 'Miami Beach', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33141', city: 'Miami Beach', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33142', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33143', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33144', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33145', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33146', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33147', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33148', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33149', city: 'Miami Beach', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  { zipCode: '33150', city: 'Miami', state: 'Florida', stateCode: 'FL', county: 'Miami-Dade' },
  
  // Orlando, FL
  { zipCode: '32801', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  { zipCode: '32802', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  { zipCode: '32803', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  { zipCode: '32804', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  { zipCode: '32805', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  { zipCode: '32806', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  { zipCode: '32807', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  { zipCode: '32808', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  { zipCode: '32809', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  { zipCode: '32810', city: 'Orlando', state: 'Florida', stateCode: 'FL', county: 'Orange' },
  
  // Tampa, FL
  { zipCode: '33601', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  { zipCode: '33602', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  { zipCode: '33603', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  { zipCode: '33604', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  { zipCode: '33605', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  { zipCode: '33606', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  { zipCode: '33607', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  { zipCode: '33608', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  { zipCode: '33609', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  { zipCode: '33610', city: 'Tampa', state: 'Florida', stateCode: 'FL', county: 'Hillsborough' },
  
  // New York
  { zipCode: '10001', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10002', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10003', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10004', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10005', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10006', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10007', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10008', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10009', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10010', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10011', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10012', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10013', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10014', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10016', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10017', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10018', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10019', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10020', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10021', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10022', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10023', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10024', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  { zipCode: '10025', city: 'New York', state: 'New York', stateCode: 'NY', county: 'New York' },
  
  // Los Angeles, CA
  { zipCode: '90001', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90002', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90003', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90004', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90005', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90006', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90007', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90008', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90009', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90010', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90011', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90012', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90013', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90014', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90015', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90016', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90017', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90018', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90019', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90020', city: 'Los Angeles', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90210', city: 'Beverly Hills', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  
  // Chicago, IL
  { zipCode: '60601', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  { zipCode: '60602', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  { zipCode: '60603', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  { zipCode: '60604', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  { zipCode: '60605', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  { zipCode: '60606', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  { zipCode: '60607', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  { zipCode: '60608', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  { zipCode: '60609', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  { zipCode: '60610', city: 'Chicago', state: 'Illinois', stateCode: 'IL', county: 'Cook' },
  
  // Houston, TX
  { zipCode: '77001', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  { zipCode: '77002', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  { zipCode: '77003', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  { zipCode: '77004', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  { zipCode: '77005', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  { zipCode: '77006', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  { zipCode: '77007', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  { zipCode: '77008', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  { zipCode: '77009', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  { zipCode: '77010', city: 'Houston', state: 'Texas', stateCode: 'TX', county: 'Harris' },
  
  // Dallas, TX
  { zipCode: '75201', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  { zipCode: '75202', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  { zipCode: '75203', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  { zipCode: '75204', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  { zipCode: '75205', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  { zipCode: '75206', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  { zipCode: '75207', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  { zipCode: '75208', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  { zipCode: '75209', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  { zipCode: '75210', city: 'Dallas', state: 'Texas', stateCode: 'TX', county: 'Dallas' },
  
  // Washington, DC
  { zipCode: '20001', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  { zipCode: '20002', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  { zipCode: '20003', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  { zipCode: '20004', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  { zipCode: '20005', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  { zipCode: '20006', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  { zipCode: '20007', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  { zipCode: '20008', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  { zipCode: '20009', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  { zipCode: '20010', city: 'Washington', state: 'District of Columbia', stateCode: 'DC', county: 'District of Columbia' },
  
  // Atlanta, GA
  { zipCode: '30301', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30302', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30303', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30304', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30305', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30306', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30307', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'DeKalb' },
  { zipCode: '30308', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30309', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30310', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  
  // Boston, MA
  { zipCode: '02101', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  { zipCode: '02102', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  { zipCode: '02103', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  { zipCode: '02104', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  { zipCode: '02105', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  { zipCode: '02106', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  { zipCode: '02107', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  { zipCode: '02108', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  { zipCode: '02109', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  { zipCode: '02110', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', county: 'Suffolk' },
  
  // Seattle, WA
  { zipCode: '98101', city: 'Seattle', state: 'Washington', stateCode: 'WA', county: 'King' },
  { zipCode: '98102', city: 'Seattle', state: 'Washington', stateCode: 'WA', county: 'King' },
  { zipCode: '98103', city: 'Seattle', state: 'Washington', stateCode: 'WA', county: 'King' },
  { zipCode: '98104', city: 'Seattle', state: 'Washington', stateCode: 'WA', county: 'King' },
  { zipCode: '98105', city: 'Seattle', state: 'Washington', stateCode: 'WA', county: 'King' },
  { zipCode: '98106', city: 'Seattle', state: 'Washington', stateCode: 'WA', county: 'King' },
  { zipCode: '98107', city: 'Seattle', state: 'Washington', stateCode: 'WA', county: 'King' },
  { zipCode: '98108', city: 'Seattle', state: 'Washington', stateCode: 'WA', county: 'King' },
  { zipCode: '98109', city: 'Seattle', state: 'Washington', stateCode: 'WA', county: 'King' },
  { zipCode: '98110', city: 'Bainbridge Island', state: 'Washington', stateCode: 'WA', county: 'Kitsap' },
  
  // Phoenix, AZ
  { zipCode: '85001', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85002', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85003', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85004', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85005', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85006', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85007', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85008', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85009', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85010', city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  
  // Philadelphia, PA
  { zipCode: '19101', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  { zipCode: '19102', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  { zipCode: '19103', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  { zipCode: '19104', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  { zipCode: '19105', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  { zipCode: '19106', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  { zipCode: '19107', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  { zipCode: '19108', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  { zipCode: '19109', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  { zipCode: '19110', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', county: 'Philadelphia' },
  
  // San Antonio, TX
  { zipCode: '78201', city: 'San Antonio', state: 'Texas', stateCode: 'TX', county: 'Bexar' },
  { zipCode: '78202', city: 'San Antonio', state: 'Texas', stateCode: 'TX', county: 'Bexar' },
  { zipCode: '78203', city: 'San Antonio', state: 'Texas', stateCode: 'TX', county: 'Bexar' },
  { zipCode: '78204', city: 'San Antonio', state: 'Texas', stateCode: 'TX', county: 'Bexar' },
  { zipCode: '78205', city: 'San Antonio', state: 'Texas', stateCode: 'TX', county: 'Bexar' },
  
  // San Diego, CA
  { zipCode: '92101', city: 'San Diego', state: 'California', stateCode: 'CA', county: 'San Diego' },
  { zipCode: '92102', city: 'San Diego', state: 'California', stateCode: 'CA', county: 'San Diego' },
  { zipCode: '92103', city: 'San Diego', state: 'California', stateCode: 'CA', county: 'San Diego' },
  { zipCode: '92104', city: 'San Diego', state: 'California', stateCode: 'CA', county: 'San Diego' },
  { zipCode: '92105', city: 'San Diego', state: 'California', stateCode: 'CA', county: 'San Diego' },
  
  // Las Vegas, NV
  { zipCode: '89101', city: 'Las Vegas', state: 'Nevada', stateCode: 'NV', county: 'Clark' },
  { zipCode: '89102', city: 'Las Vegas', state: 'Nevada', stateCode: 'NV', county: 'Clark' },
  { zipCode: '89103', city: 'Las Vegas', state: 'Nevada', stateCode: 'NV', county: 'Clark' },
  { zipCode: '89104', city: 'Las Vegas', state: 'Nevada', stateCode: 'NV', county: 'Clark' },
  { zipCode: '89105', city: 'Las Vegas', state: 'Nevada', stateCode: 'NV', county: 'Clark' },
  
  // Denver, CO
  { zipCode: '80201', city: 'Denver', state: 'Colorado', stateCode: 'CO', county: 'Denver' },
  { zipCode: '80202', city: 'Denver', state: 'Colorado', stateCode: 'CO', county: 'Denver' },
  { zipCode: '80203', city: 'Denver', state: 'Colorado', stateCode: 'CO', county: 'Denver' },
  { zipCode: '80204', city: 'Denver', state: 'Colorado', stateCode: 'CO', county: 'Denver' },
  { zipCode: '80205', city: 'Denver', state: 'Colorado', stateCode: 'CO', county: 'Denver' },
  
  // Nashville, TN
  { zipCode: '37201', city: 'Nashville', state: 'Tennessee', stateCode: 'TN', county: 'Davidson' },
  { zipCode: '37202', city: 'Nashville', state: 'Tennessee', stateCode: 'TN', county: 'Davidson' },
  { zipCode: '37203', city: 'Nashville', state: 'Tennessee', stateCode: 'TN', county: 'Davidson' },
  { zipCode: '37204', city: 'Nashville', state: 'Tennessee', stateCode: 'TN', county: 'Davidson' },
  { zipCode: '37205', city: 'Nashville', state: 'Tennessee', stateCode: 'TN', county: 'Davidson' },
  
  // Portland, OR
  { zipCode: '97201', city: 'Portland', state: 'Oregon', stateCode: 'OR', county: 'Multnomah' },
  { zipCode: '97202', city: 'Portland', state: 'Oregon', stateCode: 'OR', county: 'Multnomah' },
  { zipCode: '97203', city: 'Portland', state: 'Oregon', stateCode: 'OR', county: 'Multnomah' },
  { zipCode: '97204', city: 'Portland', state: 'Oregon', stateCode: 'OR', county: 'Multnomah' },
  { zipCode: '97205', city: 'Portland', state: 'Oregon', stateCode: 'OR', county: 'Multnomah' },
  
  // Austin, TX
  { zipCode: '73301', city: 'Austin', state: 'Texas', stateCode: 'TX', county: 'Travis' },
  { zipCode: '78701', city: 'Austin', state: 'Texas', stateCode: 'TX', county: 'Travis' },
  { zipCode: '78702', city: 'Austin', state: 'Texas', stateCode: 'TX', county: 'Travis' },
  { zipCode: '78703', city: 'Austin', state: 'Texas', stateCode: 'TX', county: 'Travis' },
  { zipCode: '78704', city: 'Austin', state: 'Texas', stateCode: 'TX', county: 'Travis' },
  
  // San Francisco, CA
  { zipCode: '94101', city: 'San Francisco', state: 'California', stateCode: 'CA', county: 'San Francisco' },
  { zipCode: '94102', city: 'San Francisco', state: 'California', stateCode: 'CA', county: 'San Francisco' },
  { zipCode: '94103', city: 'San Francisco', state: 'California', stateCode: 'CA', county: 'San Francisco' },
  { zipCode: '94104', city: 'San Francisco', state: 'California', stateCode: 'CA', county: 'San Francisco' },
  { zipCode: '94105', city: 'San Francisco', state: 'California', stateCode: 'CA', county: 'San Francisco' },
  
  // Más ciudades importantes de diferentes estados
  
  // Detroit, MI
  { zipCode: '48201', city: 'Detroit', state: 'Michigan', stateCode: 'MI', county: 'Wayne' },
  { zipCode: '48202', city: 'Detroit', state: 'Michigan', stateCode: 'MI', county: 'Wayne' },
  { zipCode: '48203', city: 'Detroit', state: 'Michigan', stateCode: 'MI', county: 'Wayne' },
  
  // Minneapolis, MN
  { zipCode: '55401', city: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', county: 'Hennepin' },
  { zipCode: '55402', city: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', county: 'Hennepin' },
  { zipCode: '55403', city: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', county: 'Hennepin' },
  
  // Charlotte, NC
  { zipCode: '28201', city: 'Charlotte', state: 'North Carolina', stateCode: 'NC', county: 'Mecklenburg' },
  { zipCode: '28202', city: 'Charlotte', state: 'North Carolina', stateCode: 'NC', county: 'Mecklenburg' },
  { zipCode: '28203', city: 'Charlotte', state: 'North Carolina', stateCode: 'NC', county: 'Mecklenburg' },
  
  // Indianapolis, IN
  { zipCode: '46201', city: 'Indianapolis', state: 'Indiana', stateCode: 'IN', county: 'Marion' },
  { zipCode: '46202', city: 'Indianapolis', state: 'Indiana', stateCode: 'IN', county: 'Marion' },
  { zipCode: '46203', city: 'Indianapolis', state: 'Indiana', stateCode: 'IN', county: 'Marion' },
  
  // Columbus, OH
  { zipCode: '43201', city: 'Columbus', state: 'Ohio', stateCode: 'OH', county: 'Franklin' },
  { zipCode: '43202', city: 'Columbus', state: 'Ohio', stateCode: 'OH', county: 'Franklin' },
  { zipCode: '43203', city: 'Columbus', state: 'Ohio', stateCode: 'OH', county: 'Franklin' },
  
  // Fort Worth, TX
  { zipCode: '76101', city: 'Fort Worth', state: 'Texas', stateCode: 'TX', county: 'Tarrant' },
  { zipCode: '76102', city: 'Fort Worth', state: 'Texas', stateCode: 'TX', county: 'Tarrant' },
  { zipCode: '76103', city: 'Fort Worth', state: 'Texas', stateCode: 'TX', county: 'Tarrant' },
  
  // San Jose, CA
  { zipCode: '95101', city: 'San Jose', state: 'California', stateCode: 'CA', county: 'Santa Clara' },
  { zipCode: '95102', city: 'San Jose', state: 'California', stateCode: 'CA', county: 'Santa Clara' },
  { zipCode: '95103', city: 'San Jose', state: 'California', stateCode: 'CA', county: 'Santa Clara' },
  
  // Jacksonville, FL
  { zipCode: '32201', city: 'Jacksonville', state: 'Florida', stateCode: 'FL', county: 'Duval' },
  { zipCode: '32202', city: 'Jacksonville', state: 'Florida', stateCode: 'FL', county: 'Duval' },
  { zipCode: '32203', city: 'Jacksonville', state: 'Florida', stateCode: 'FL', county: 'Duval' },
  
  // Louisville, KY
  { zipCode: '40201', city: 'Louisville', state: 'Kentucky', stateCode: 'KY', county: 'Jefferson' },
  { zipCode: '40202', city: 'Louisville', state: 'Kentucky', stateCode: 'KY', county: 'Jefferson' },
  { zipCode: '40203', city: 'Louisville', state: 'Kentucky', stateCode: 'KY', county: 'Jefferson' },
  
  // Memphis, TN
  { zipCode: '38101', city: 'Memphis', state: 'Tennessee', stateCode: 'TN', county: 'Shelby' },
  { zipCode: '38102', city: 'Memphis', state: 'Tennessee', stateCode: 'TN', county: 'Shelby' },
  { zipCode: '38103', city: 'Memphis', state: 'Tennessee', stateCode: 'TN', county: 'Shelby' },
  
  // Baltimore, MD
  { zipCode: '21201', city: 'Baltimore', state: 'Maryland', stateCode: 'MD', county: 'Baltimore City' },
  { zipCode: '21202', city: 'Baltimore', state: 'Maryland', stateCode: 'MD', county: 'Baltimore City' },
  { zipCode: '21203', city: 'Baltimore', state: 'Maryland', stateCode: 'MD', county: 'Baltimore City' },
  
  // Milwaukee, WI
  { zipCode: '53201', city: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', county: 'Milwaukee' },
  { zipCode: '53202', city: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', county: 'Milwaukee' },
  { zipCode: '53203', city: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', county: 'Milwaukee' },
  
  // Albuquerque, NM
  { zipCode: '87101', city: 'Albuquerque', state: 'New Mexico', stateCode: 'NM', county: 'Bernalillo' },
  { zipCode: '87102', city: 'Albuquerque', state: 'New Mexico', stateCode: 'NM', county: 'Bernalillo' },
  { zipCode: '87103', city: 'Albuquerque', state: 'New Mexico', stateCode: 'NM', county: 'Bernalillo' },
  
  // Tucson, AZ
  { zipCode: '85701', city: 'Tucson', state: 'Arizona', stateCode: 'AZ', county: 'Pima' },
  { zipCode: '85702', city: 'Tucson', state: 'Arizona', stateCode: 'AZ', county: 'Pima' },
  { zipCode: '85703', city: 'Tucson', state: 'Arizona', stateCode: 'AZ', county: 'Pima' },
  
  // Fresno, CA
  { zipCode: '93701', city: 'Fresno', state: 'California', stateCode: 'CA', county: 'Fresno' },
  { zipCode: '93702', city: 'Fresno', state: 'California', stateCode: 'CA', county: 'Fresno' },
  { zipCode: '93703', city: 'Fresno', state: 'California', stateCode: 'CA', county: 'Fresno' },
  
  // Sacramento, CA
  { zipCode: '95814', city: 'Sacramento', state: 'California', stateCode: 'CA', county: 'Sacramento' },
  { zipCode: '95815', city: 'Sacramento', state: 'California', stateCode: 'CA', county: 'Sacramento' },
  { zipCode: '95816', city: 'Sacramento', state: 'California', stateCode: 'CA', county: 'Sacramento' },
  
  // Kansas City, MO
  { zipCode: '64101', city: 'Kansas City', state: 'Missouri', stateCode: 'MO', county: 'Jackson' },
  { zipCode: '64102', city: 'Kansas City', state: 'Missouri', stateCode: 'MO', county: 'Jackson' },
  { zipCode: '64103', city: 'Kansas City', state: 'Missouri', stateCode: 'MO', county: 'Jackson' },
  
  // Mesa, AZ
  { zipCode: '85201', city: 'Mesa', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85202', city: 'Mesa', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  { zipCode: '85203', city: 'Mesa', state: 'Arizona', stateCode: 'AZ', county: 'Maricopa' },
  
  // Virginia Beach, VA
  { zipCode: '23451', city: 'Virginia Beach', state: 'Virginia', stateCode: 'VA', county: 'Virginia Beach City' },
  { zipCode: '23452', city: 'Virginia Beach', state: 'Virginia', stateCode: 'VA', county: 'Virginia Beach City' },
  { zipCode: '23453', city: 'Virginia Beach', state: 'Virginia', stateCode: 'VA', county: 'Virginia Beach City' },
  
  // Atlanta (más códigos)
  { zipCode: '30311', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30312', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  { zipCode: '30313', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', county: 'Fulton' },
  
  // Omaha, NE
  { zipCode: '68101', city: 'Omaha', state: 'Nebraska', stateCode: 'NE', county: 'Douglas' },
  { zipCode: '68102', city: 'Omaha', state: 'Nebraska', stateCode: 'NE', county: 'Douglas' },
  { zipCode: '68103', city: 'Omaha', state: 'Nebraska', stateCode: 'NE', county: 'Douglas' },
  
  // Raleigh, NC
  { zipCode: '27601', city: 'Raleigh', state: 'North Carolina', stateCode: 'NC', county: 'Wake' },
  { zipCode: '27602', city: 'Raleigh', state: 'North Carolina', stateCode: 'NC', county: 'Wake' },
  { zipCode: '27603', city: 'Raleigh', state: 'North Carolina', stateCode: 'NC', county: 'Wake' },
  
  // Long Beach, CA
  { zipCode: '90801', city: 'Long Beach', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90802', city: 'Long Beach', state: 'California', stateCode: 'CA', county: 'Los Angeles' },
  { zipCode: '90803', city: 'Long Beach', state: 'California', stateCode: 'CA', county: 'Los Angeles' }
];

// Función para buscar por código postal
export const findByZipCode = (zipCode: string): ZipCodeData | undefined => {
  return ZIP_CODE_DATABASE.find(item => item.zipCode === zipCode);
};

// Función para buscar por ciudad y estado
export const findByCity = (city: string, stateCode?: string): ZipCodeData[] => {
  const cityLower = city.toLowerCase();
  return ZIP_CODE_DATABASE.filter(item => {
    const matchesCity = item.city.toLowerCase().includes(cityLower);
    const matchesState = !stateCode || item.stateCode === stateCode.toUpperCase();
    return matchesCity && matchesState;
  });
};

// Función para buscar direcciones con autocompletado mejorado
export const searchAddresses = (query: string): ZipCodeData[] => {
  if (!query || query.length < 2) return [];
  
  const queryLower = query.toLowerCase().trim();
  const results: ZipCodeData[] = [];
  const scores: { item: ZipCodeData; score: number }[] = [];
  
  // Buscar por código postal exacto primero
  if (/^\d{5}$/.test(query)) {
    const exactMatch = ZIP_CODE_DATABASE.find(item => item.zipCode === query);
    if (exactMatch) return [exactMatch];
  }
  
  // Calcular puntuación para cada elemento
  for (const item of ZIP_CODE_DATABASE) {
    const score = calculateSearchScore(item, queryLower);
    if (score > 0) {
      scores.push({ item, score });
    }
  }
  
  // Ordenar por puntuación y devolver los mejores resultados
  // Aumentar el límite para tener más variedad
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(s => s.item);
};

// Calcular puntuación de relevancia para búsqueda
function calculateSearchScore(item: ZipCodeData, query: string): number {
  let score = 0;
  const cityLower = item.city.toLowerCase();
  const stateLower = item.state.toLowerCase();
  const stateCodeLower = item.stateCode.toLowerCase();
  const countyLower = item.county.toLowerCase();
  
  // Coincidencia exacta (máxima puntuación)
  if (cityLower === query) return 1000;
  if (stateCodeLower === query) return 950;
  if (item.zipCode === query) return 900;
  
  // Comienza con la query (alta puntuación)
  if (cityLower.startsWith(query)) score += 800;
  if (item.zipCode.startsWith(query)) score += 850;
  if (countyLower.startsWith(query)) score += 700;
  
  // Contiene la query (puntuación media)
  if (cityLower.includes(query)) score += 500;
  if (stateLower.includes(query)) score += 600;
  if (countyLower.includes(query)) score += 400;
  
  // Penalizar si la query es muy corta y no hay coincidencia fuerte
  if (query.length < 3 && score < 700) {
    score = Math.max(0, score - 200);
  }
  
  // Bonus para diversidad de estados (reducir el bonus de Miami para mejor diversidad)
  const importantCities = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose'];
  if (importantCities.includes(cityLower)) {
    score += 150;
  }
  
  // Bonus menor para Miami para evitar que domine los resultados
  if (cityLower === 'miami') {
    score += 50;
  }
  
  // Bonus para ciudades de diferentes estados
  const diverseStates = ['ny', 'ca', 'tx', 'il', 'az', 'pa', 'wa', 'co', 'ga', 'ma'];
  if (diverseStates.includes(stateCodeLower)) {
    score += 75;
  }
  
  return score;
}