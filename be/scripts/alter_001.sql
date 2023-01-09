create table draft (
	id_draft int not null auto_increment,
	id_user int not null,
	description varchar(100) not null,
	translation_meaning varchar(200),
	created_at datetime not null,
	constraint pk_draft primary key(id_draft)
);

alter table draft add constraint fk_draft_user foreign key(id_user) references user(id_user) on delete cascade;