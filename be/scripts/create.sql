create table user
(
   id_user int not null auto_increment,
   description varchar(200) not null,
   email varchar(200) not null,
   password varchar(2000),
   annotations varchar(2000),
   constraint pk_user primary key(id_user)
);

create table expression
(
   id_expression int not null auto_increment,
   id_user int not null,
   description varchar(100) not null,
   meaning varchar(200),
   example_phrase varchar(2000),
   synonyms varchar(200),
   valid int not null,
   catalog_date datetime not null,
   constraint pk_expression primary key(id_expression)
);

alter table expression add constraint fk_expression_user foreign key(id_user) references user(id_user) on delete cascade;

create index idx_expression_description on expression(description);

create table user_goal 
(
   id_user int not null,
   start_date datetime not null,
   goal int not null,
   constraint pk_user_goal primary key(id_user, start_date)
);

alter table user_goal add constraint fk_user_goal_user foreign key(id_user) references user(id_user) on delete cascade;



create table refresh_token
(
   token varchar(200) not null,
   id_user int not null,
   expire_date datetime not null,
   created_at datetime,
   constraint pk_refresh_token primary key(token)
);

alter table refresh_token add constraint fk_refresh_token_id_user
foreign key(id_user) references user(id_user) on delete cascade;

insert into user
(
   id_user, 
   description, 
   email
)
values(1, 'Demo', 'demo@test.com');

insert into user_goal
(
   id_user, 
   start_date,
   goal
)
values(1, '2000-01-01', 10);

commit;