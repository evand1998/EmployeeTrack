const mysql = require('mysql2');
require("dotenv").config();
require('console.table');

const connectionInfo = require('./.env');
const app = require('./index.js');

const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    database: process.env.DB_NAME,
});
db.connect(err => {
    if (err) throw err;
    app.init();
});
var showAll = (table_name,callback) => {
    let query = "";
    if (table_name === "employees") {
        query = `SELECT emp1.firstName AS 'First Name', emp1.lastName AS 'Last Name', title AS 'Title', name AS 'Department', salary AS 'Salary', GROUP_CONCAT(DISTINCT emp2.firstName,' ', emp2.lastName) AS 'Manager'
        FROM employees emp1
        JOIN pos ON emp1.pos_id = pos.id
        JOIN departments ON pos.department_id = departments.id
        LEFT JOIN employees emp2 ON emp1.manager_id = emp2.id
        GROUP BY emp1.id
        ORDER BY emp1.lastName ASC`;
    } else if (table_name === "pos") {   
        query = `SELECT title AS 'Position', name AS 'Department', salary AS 'Salary', COUNT(employees._id) AS 'Total Employees'
        FROM pos
        LEFT OUTER JOIN departments ON pos.department_id = departments.id
        LEFT OUTER JOIN employees ON employees.pos_id = pos.id
        GROUP BY pos.id
        ORDER BY title ASC`;
    } else if (table_name === "departments") {
        query = `SELECT name AS 'Department', COUNT(pos.department_id) AS 'Total pos'
        FROM departments
        LEFT OUTER JOIN pos ON pos.department_id = departments.id
        GROUP BY departments.id
        ORDER BY name ASC`;
    }
    db.query(query,table_name,(err,res) => {
        if (err) throw err;
        console.log('\n');
        console.table(res);
        callback();
    });
}
var createRow = (data,table_name,callback) => {
    db.query(`INSERT INTO ${table_name} SET ?`,[data],function(err,res) {
        if (err) throw err;
        console.log("\nSuccess! Added to "+table_name+".\n");
        callback();
    });
}
var getSpecific = (columns, table) => {
    return new Promise(function(resolve, reject){
        db.query(`SELECT ${columns} FROM ${table}`,(err,res) => {
            if (err) throw err;
            if (res === undefined) {
                reject(new Error("Not found."));
            } else {
                resolve(res);
            }
        });
    });
}
var update = (table_name, new_data, id, callback) => {
    db.query('UPDATE ?? SET ? WHERE ?',[table_name,new_data,id],function(err,res) {
        console.log("\nSuccessfully updated "+table_name.slice(0,-1)+"!\n");
        callback();
    });
}
var deleteRow = (table_name, id, callback) => {
    db.query('DELETE FROM ?? WHERE ?',[table_name,id], function(err,res) {
        if (table_name === "pos") {
            db.query("DELETE FROM employees WHERE pos_id IN (SELECT role_id FROM pos WHERE pos_id = ?);",[id.id],function(err,result) {
                if (err) throw err;
                console.log("\n Successfully deleted the position and all employees associated with it.\n");
                return callback();
            });
        } else if (table_name === "departments") {
            db.query("DELETE FROM employees WHERE pos_id IN (SELECT role_id FROM pos WHERE pos_id =roles WHERE department_id = "+id.id+");", function(err, result) {
                if (err) throw err;
                db.query("DELETE FROM pos WHERE department_id = ?",[id.id],function(err, result) {
                    if (err) throw err;
                    console.log("\n Successfully deleted department and the position and employees associated with it. \n");
                    callback();
                });
            });
        } else if (table_name === "employees") {
            console.log("\n Successfully deleted employee.\n");
            callback();
        }
    });

}
var getEmployeeChoices = function() {
    return getSpecific('id,firstName,lastName','employees').then(res => {
        let employeeChoices = [];
        res.forEach(choice => {
            employeeChoices.push({name: choice.firstName + " "+choice.lastName, value: choice.id });
        });
        return new Promise(function(resolve,reject) {
            if (employeeChoices.length > 0) {
                resolve(employeeChoices);
            } else {
                reject(new Error("There was a problem retrieving employees"));
            }
        });
    });
}
var getPosChoices = function() {
    return getSpecific('id,title','pos').then(res => {
        let roleChoices = [];
        res.forEach(choice => {
            posChoices.push({name: choice.title, value: choice.id });
        });
        return new Promise(function(resolve,reject) {
            if (posChoices.length > 0) {
                resolve(posChoices);
            } else {
                reject(new Error("There was a problem retrieving positions."));
            }
        });
    });
}
var getDepartmentChoices = function() {
    return getSpecific('id,name','departments').then(res => {
        let departmentChoices = [];
        res.forEach(choice => {
            departmentChoices.push({name: choice.name, value: choice.id });
        });
        return new Promise(function(resolve,reject) {
            if (departmentChoices.length > 0) {
                resolve(departmentChoices);
            } else {
                reject(new Error("There was a problem retrieving departments."));
            }
        });
    });
}
module.exports = {
    connection: db,
    getSpecific: getSpecific,
    showAll: showAll,
    createRow: createRow,
    update: update,
    deleteRow: deleteRow,
    choices: {
        employees: getEmployeeChoices,
        pos: getPosChoices,
        departments: getDepartmentChoices
    }
}