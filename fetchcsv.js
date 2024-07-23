require('dotenv').config(); // Load environment variables
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Load API token from environment variables
const apiToken = process.env.API_TOKEN;

// Set API endpoint
const apiEndpoint = 'https://flyingbullinternet.sonar.software/api/graphql/';

// Set headers for API request
const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json'
};

// Set GraphQL query
const gqlQuery = `
  query accounts {
    accounts(paginator: { page: 1, records_per_page: 10000 }) {
      entities {
        next_bill_date
        next_recurring_charge_amount
        account_services {
          entities {
            package {
              package_services {
                entities {
                  package_id
                  service_id
                }
              }
            }
          }
        }
        id
        name
        account_status_id
        addresses {
          entities {
            line1
            line2
            city
            zip
            id
            serviceable
            addressable_id
            latitude
            longitude
            custom_field_data {
              entities {
                value
              }
            }
          }
        }
        custom_field_data {
          entities {
            value
          }
        }
      }
    }
  }
`;

// Fetch API data
axios.post(apiEndpoint, { query: gqlQuery }, { headers })
  .then(response => {
    const data = response.data.data.accounts.entities;

    console.log('API Response Data:', data);

    const csvRows = data.map(account => {
      const row = {
        'Sonar Account ID': account.id,
        'Sonar Account Name': account.name,
        'Account Status': getAccountStatus(account.account_status_id),
        'Next_Recurring_Amount': account.next_recurring_charge_amount / 100,
        'Next_Bill_Date': account.next_bill_date
      };

      // Flatten addresses
      const addresses = account.addresses.entities[0];
      if (addresses) {
        row['Sonar Address Line 1'] = addresses.line1;
        row['Sonar Adddress Line 2'] = addresses.line2;
        row['Sonar City'] = addresses.city;
        row['Sonar Zip'] = addresses.zip;
        row['Sonar Address ID'] = addresses.id;
        row['Sonar Latitude'] = addresses.latitude;
        row['Sonar Longitude'] = addresses.longitude;
        row['address_id'] = addresses.custom_field_data.entities.length > 0 ? addresses.custom_field_data.entities[0].value : 'NA';
      } else {
        row['Sonar Address Line 1'] = 'NA';
        row['Sonar Adddress Line 2'] = 'NA';
        row['Sonar City'] = 'NA';
        row['Sonar Zip'] = 'NA';
        row['Sonar Address ID'] = 'NA';
        row['Sonar Latitude'] = 'NA';
        row['Sonar Longitude'] = 'NA';
        row['address_id'] = '0';
      }

      // Flatten custom field data
      const customFieldData = account.custom_field_data.entities[0];
      row['CFID'] = customFieldData ? customFieldData.value : 'NA';

      // Flatten package data
      const packageService = account.account_services.entities[0];
      if (packageService && packageService.package) {
        const packageId = packageService.package.package_services && packageService.package.package_services.entities[0] ? packageService.package.package_services.entities[0].package_id : null;
        let packageName;
        switch (packageId) {
          case '2':
            packageName = 'Package 1 300 Mbps';
            break;
          case '3':
            packageName = 'Package 2 1 Gbps';
            break;
          case '1':
            packageName = 'Package Test';
            break;
          default:
            packageName = 'Package 3 2.5 Gbps';
        }
        row['Package'] = packageName || 'NA';
      } else {
        row['Package'] = 'NA';
      }

      return row;
    });

    console.log('CSV Rows:', csvRows);

    const csvWriter = createCsvWriter({
      path: 'SonarData_Accounts.csv',
      header: [
        { id: 'Sonar Account ID', title: 'Sonar Account ID' },
        { id: 'Sonar Account Name', title: 'Sonar Account Name' },
        { id: 'Account Status', title: 'Account Status' },
        { id: 'Next_Recurring_Amount', title: 'Next_Recurring_Amount' },
        { id: 'Next_Bill_Date', title: 'Next_Bill_Date' },
        { id: 'Sonar Address Line 1', title: 'Sonar Address Line 1' },
        { id: 'Sonar Adddress Line 2', title: 'Sonar Adddress Line 2' },
        { id: 'Sonar City', title: 'Sonar City' },
        { id: 'Sonar Zip', title: 'Sonar Zip' },
        { id: 'Sonar Address ID', title: 'Sonar Address ID' },
        { id: 'Sonar Latitude', title: 'Sonar Latitude' },
        { id: 'Sonar Longitude', title: 'Sonar Longitude' },
        { id: 'address_id', title: 'address_id' },
        { id: 'CFID', title: 'CFID' },
        { id: 'Package', title: 'Package' }
      ]
    });

    csvWriter.writeRecords(csvRows)
      .then(() => console.log('CSV file created successfully'));

  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });

// Helper function to get account status
function getAccountStatus(statusId) {
  switch (statusId) {
    case '1':
      return 'Active';
    case '5':
      return 'Failed Install';
    case '2':
      return 'Inactive';
    case '3':
      return 'Lead';
    case '37':
      return 'Package Selected';
    case '38':
      return 'Payment Verified';
    case '39':
      return 'Scheduled';
    default:
      return 'Suspended';
  }
}
