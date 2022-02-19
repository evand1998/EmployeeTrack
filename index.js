const inquirer = require('inquirer');
const db = require('./db.js');
const ascii = require('ascii-art-font');
var init = () => {

    console.log("\n"+"=".repeat(62)+"\n");
    ascii.create('    Employee','Doom',(err, result) => {
        if (err) throw err;
        console.log(result);
        ascii.create('      Manager','Doom',(err, result) => {
            if (err) throw err;
            console.log(result);
            console.log("\n"+"=".repeat(62)+"\n");
            mainPrompt();
        });
    });
    
}
var mainPrompt = () => {
    inquirer.prompt([
        {
            message: "What would you like to do?",
            type: "list",
            name: "doWhat",
            choices: ["View","Add","Edit","Remove","Quit"]
        }
    ]).then(answers => {
        switch(answers.doWhat) {
            case "View":
                return viewPrompt();
            case "Add":
                return createPrompt(false);
            case "Edit":
                return updatePrompt(false);
            case "Remove":
                return removePrompt(false);
            case "Quit":
                return quitApp();
        }
    });
}
function viewPrompt() {
    inquirer.prompt([
        {
            message: "View:",
            type: "list",
            name: "table_name",
            choices: [{name: "All Employees", value: "employees"},{name:"All Departments",value: "departments"},{name:"All Positions", value: "pos"}]
        }
    ]).then(answers => {

        db.showAll(answers.table_name, callMainPrompt);
    });
}
function createPrompt(table_name) {
    if (table_name === false) {
        inquirer.prompt([
            {
                message: "What do you like to add?",
                name: "table_name",
                type: "list",
                choices: [
                    {
                        name: "New Employee",
                        value: "employees"
                    },
                    {
                        name: "New Position",
                        value: "pos"
                    },
                    {
                        name: "New Department",
                        value: "departments"
                    },
                    {
                        name: "Back to Main Menu",
                        value: "mainMenu"
                    }
                ]
            }
        ]).then(answers => {

            if (answers.table_name === "mainMenu") return mainPrompt();

            return createPrompt(answers.table_name);
        });

    }
    if (table_name === "employees") {

        let questions = [
            {
                message: "First Name:",
                name: "firstName"
            },
            {
                message: "Last Name:",
                name: "lastName"
            }
        ];
        db.choices.pos().then(res => {
            questions.push(formatListQuestion("pos","pos_id",res));
            db.choices.employees().then(res => {
                questions.push({
                    message: "Select manager:",
                    type: "list",
                    name: "manager_id",
                    choices: res
                });
                inquirer.prompt(questions).then(answers => {
                    db.createRow(answers,table_name,callMainPrompt);  
                });
            });
        });
    } 
    else if (table_name === "pos") {
        let questions = [
            {
                message: "Position Title:",
                name: "title"
            },
            {
                message: "Salary",
                name: "salary",
                validate: salary => {
                    if (isNaN(salary)) {
                        console.log("\n Invalid: Must be a number. Do not include decimals.");
                        return false;
                    } else {
                        return true;
                    }
                }
            }
        ];

        db.choices.departments().then(res => {
            questions.push(formatListQuestion("department","department_id",res));   
            inquirer.prompt(questions).then(answers => {
                db.createRow(answers,table_name, callMainPrompt);
    
            });
        });

    } 
    else if (table_name === "departments") {
        inquirer.prompt([
            {
                message: "Department Name:",
                name: "name"
            }
        ]).then(answers => {
            db.createRow(answers,table_name, callMainPrompt);
        });
    }
}
function updatePrompt(table_name) {
    if (table_name === false) {

        inquirer.prompt([
            {
                message: "What do you want to edit?",
                name: "table_name",
                type: "list",
                choices: [
                    {
                        name: "Employee",
                        value: "employees"
                    },
                    {
                        name: "Position",
                        value: "pos"
                    },
                    {
                        name: "Department",
                        value: "departments"
                    },
                    {
                        name: "Back to Main Menu",
                        value: "mainMenu"
                    }
                ]
            }
        ]).then(answers => {
            if (answers.table_name === "mainMenu") return mainPrompt();
            return updatePrompt(answers.table_name);
        });

    } else {

        db.showAll(table_name, () => {});

        if (table_name === "employees") {

            db.choices.employees().then(res => {

                inquirer.prompt([
                    formatListQuestion("employee","employee_id",res),
                    {
                        message: "What do you want to update for this employee?",
                        name: "whatToUpdate",
                        type: "list",
                        choices: ["Role","Manager","Both"]
                    }
                ]).then(answers => {

                    let id = {id: answers.employee_id};

                    switch(answers.whatToUpdate) {

                        case "pos":
                            db.choices.roles().then(res => {
                                inquirer.prompt([formatListQuestion("pos","pos_id",res)]).then(answers => {
                                    db.update(table_name,answers,id,callMainPrompt);
                                }); 
                            });
                            break;
                        case "Manager":
                            db.choices.employees().then(res => {
                                inquirer.prompt([formatListQuestion("manager","manager_id",res)]).then(answers => {
                                    db.update(table_name,answers,id,callMainPrompt);
                                });
                            });
                            break;
                        case "Both":
                            db.choices.pos().then(res => {
                                inquirer.prompt([formatListQuestion("pos","pos_id",res)]).then(answers => {
                                    let newInfo = answers;
                                    db.choices.employees().then(res => {
                                        inquirer.prompt([formatListQuestion("manager","manager_id",res)]).then(answers => {
                                            newInfo.department_id = answers.department_id;
                                            db.update(table_name,newInfo,id,callMainPrompt);
                                        }); 
                                    });
                                }); 
                            });
                            break;

                    }

                });
            });
        } 
        else if (table_name === "pos") {
            db.choices.roles().then(res => {
                inquirer.prompt([
                    formatListQuestion("pos","id",res),
                    {
                        message: "What would you like to change?",
                        type: "list",
                        name: "whatToChange",
                        choices: ["Title","Salary","Department"]
                    }
                ]).then(answers => {
                    let posId = answers.id;
                    switch(answers.whatToChange) {
                        case "Title":
                            inquirer.prompt([
                                {
                                    message: "New title:",
                                    name: "title"
                                }
                            ]).then(answers => {
                                db.update(table_name, answers, {id: posId}, callMainPrompt);
                            });
                            break;
                        case "Salary":
                            inquirer.prompt([
                                {
                                    message: "New salary:",
                                    name: "salary",
                                    validate: salary => {
                                        if (isNaN(salary)) {
                                            console.log("\n Invalid: Must be a number. Do not include decimals.");
                                            return false;
                                        } else {
                                            return true;
                                        }
                                    }
                                }
                            ]).then(answers => {
                                db.update(table_name, answers, {id: posId}, callMainPrompt);
                            });
                            break;
                        case "Department":
                            db.choices.departments().then(res => {
                                inquirer.prompt([
                                    formatListQuestion("department","department_id",res)
                                ]).then(answers => {
                                    db.update(table_name, answers, {id: posId}, callMainPrompt);
                                });
                            });
                            break;
                    }
                });
            });

        } 
        else if (table_name === "departments") {
            db.choices.departments().then(res => {
                inquirer.prompt([
                    formatListQuestion("department","id",res),
                    {
                        message: "New department name:",
                        name: "name"
                    }
                ]).then(answers => {
                    db.update(table_name, {name: answers.name}, {id: answers.id}, callMainPrompt);
                });
            });
        }
    }
}
function removePrompt(table_name) {
    if (table_name === false) {

        inquirer.prompt([
            {
                message: "What would you like to remove?",
                name: "table_name",
                type: "list",
                choices: [
                    {
                        name: "Employee",
                        value: "employees"
                    },
                    {
                        name: "Position",
                        value: "pos"
                    },
                    {
                        name: "Department",
                        value: "departments"
                    },
                    {
                        name: "Back to Main Menu",
                        value: "mainMenu"
                    }
                ]
            }
        ]).then(answers => {
            if (answers.table_name === "mainMenu") return mainPrompt();
            return removePrompt(answers.table_name);
        });

    } else {
        db.showAll(table_name, () => {});
        if (table_name === "employees") {
            db.choices.employees().then(res => {
                inquirer.prompt([
                    formatListQuestion("employee","id",res)
                ]).then(answers => {
                    db.deleteRow(table_name,answers, callMainPrompt);
                });
            });
        } 
        else if (table_name === "pos") {
            db.choices.pos().then(res => {
                inquirer.prompt([
                    formatListQuestion("pos","id",res),
                    {
                        message: "This will delete all employees associated with this position. Are you sure?",
                        name: "confirm",
                        type: "confirm",
                    }
                ]).then(answers => {
                    if (answers.confirm) {
                        db.deleteRow(table_name,{id: answers.id}, callMainPrompt);
                    }
                });
            });
        } 
        else if (table_name === "departments") {
            db.choices.departments().then(res => {
                inquirer.prompt([
                    formatListQuestion("department","id",res),
                    {
                        message: "This will delete all roles and employees associated with this department. Are you sure?",
                        name: "confirm",
                        type: "confirm",
                    }
                ]).then(answers => {
                    if (answers.confirm) {
                        db.deleteRow(table_name,{id: answers.id}, callMainPrompt);
                    }
                });
            });
        }
    }
}
function quitApp() {
    console.log("\n"+"=".repeat(62)+"\n");
    ascii.create('    Goodbye!','Doom',(err, result) => {
        if (err) throw err;
        console.log(result);
        console.log("\n"+"=".repeat(62)+"\n");
        db.connection.end();
    });
}
function formatListQuestion(identifier, colName, choices) {
    return {
        message: `Select ${identifier}:`,
        type: "list",
        name: `${colName}`,
        choices
    };
}
function callMainPrompt() {
    mainPrompt();
}
module.exports.init = init;