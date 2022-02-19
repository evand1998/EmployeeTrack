INSERT INTO departments (name)
VALUES ("Sales"),("Legal"),("Engineering");

INSERT INTO pos (title, salary, department_id)
VALUES ("Director of Sales",145000.00,1),("Enterprise Account Executive",115000.00,1),("Mid-Market Account Executive",95000.00,1),
("General Council",150000.00,2),
("Senior Engineer",125000.00,3),("Junior Engineer",90000.00,3);

INSERT INTO employees (firstName, lastName, pos_id, manager_id)
VALUES ("Joe","Wilkins",1,null),("James","Joyce",2,1),("Glenn", "Dash",3,1),
("Rachel","Conner",4,null),
("Anna","Lopez",5,null),("Levi","Bates",6,5);