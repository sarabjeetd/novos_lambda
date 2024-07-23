const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const _ = require('lodash');
const moment = require('moment');

const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const processFiles = async () => {
  try {
    // Read CSV files
    const dfSonar = await readCSV(path.join('D:', 'manmohan', 'sonar_client', 'SonarData_Accounts.csv'));
    const dfRob = await readCSV(path.join('D:', 'manmohan', 'sonar_client', 'RobAddlist2(in).csv'));

    // Assuming dfSonar should be merged with dfRob
    // Modify this logic based on how you want to process the data
    const merged = dfSonar.map(sonar => ({
      ...sonar,
      ...dfRob.find(rob => rob.address_id === sonar.address_id) || {}
    }));

    // Create new data to filter duplicates address_id
    const addressIdCounts = _.countBy(merged, 'address_id');
    const filteredData = merged.filter(item => addressIdCounts[item.address_id] === 1 && item.address_id > 0);

    // Rename columns and filter final data
    const finalData = filteredData.map(item => ({
      'Customer ID': item['Customer ID'],
      'First Name': item['First Name'],
      'Last Name': item['Last Name'],
      'Email Address': item['Email Address'],
      'Phone Number': item['Phone Number'],
      'Street Address': item['Street Address'],
      'City': item['City_x'] || item['City'],
      'State': item['State_x'] || item['State'],
      'Created At in UTC': moment(item['Created At in UTC']).format('MM/DD/YYYY'),
      'Zone': item['Zone'],
      'Sonar Account ID_y': item['Sonar Account ID_y'],
      'Sonar Account Name': item['Sonar Account Name'],
      'Account Status': item['Account Status'],
      'Next_Recurring_Amount': item['Next_Recurring_Amount'],
      'Next_Bill_Date': item['Next_Bill_Date'],
      'Activation Date': item['Activation Date'],
      'Sonar Address Line 1': item['Sonar Address Line 1'],
      'Package': item['Package'],
      'Beacons_Service': item['Beacons_Service'],
      'Autopay_Discount': item['Autopay_Discount'],
      '3 months Discount': item['3 months Discount'],
      'FDA_NAME': item['FDAName'],
      'FDH_NAME': item['FDHName']
    }));

    // Write to CSV file
    const csvWriter = createCsvWriter({
      path: path.join('D:', 'manmohan', 'sonar_client', 'Report07052024.csv'),
      header: [
        { id: 'Customer ID', title: 'Customer ID' },
        { id: 'First Name', title: 'First Name' },
        { id: 'Last Name', title: 'Last Name' },
        { id: 'Email Address', title: 'Email Address' },
        { id: 'Phone Number', title: 'Phone Number' },
        { id: 'Street Address', title: 'Street Address' },
        { id: 'City', title: 'City' },
        { id: 'State', title: 'State' },
        { id: 'Created At in UTC', title: 'Created At in UTC' },
        { id: 'Zone', title: 'Zone' },
        { id: 'Sonar Account ID_y', title: 'Sonar Account ID_y' },
        { id: 'Sonar Account Name', title: 'Sonar Account Name' },
        { id: 'Account Status', title: 'Account Status' },
        { id: 'Next_Recurring_Amount', title: 'Next_Recurring_Amount' },
        { id: 'Next_Bill_Date', title: 'Next_Bill_Date' },
        { id: 'Activation Date', title: 'Activation Date' },
        { id: 'Sonar Address Line 1', title: 'Sonar Address Line 1' },
        { id: 'Package', title: 'Package' },
        { id: 'Beacons_Service', title: 'Beacons_Service' },
        { id: 'Autopay_Discount', title: 'Autopay_Discount' },
        { id: '3 months Discount', title: '3 months Discount' },
        { id: 'FDA_NAME', title: 'FDA_NAME' },
        { id: 'FDH_NAME', title: 'FDH_NAME' }
      ]
    });

    await csvWriter.writeRecords(finalData);
    console.log('CSV file created successfully');
  } catch (error) {
    console.error('Error processing files:', error);
  }
};

processFiles();
