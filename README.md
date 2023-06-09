# hybrid-files
A hybrid file storage solution for maintaining files locally and on the cloud.

[Alpha Demo Video (May 19, 2023)](https://youtu.be/JdJnR0ahJ-Y)

## Project Setup

### Create / seed database

Open MySQL Command line as root user

```sql
SOURCE project_path/schema.sql
```

Where `project_path` is the path to this project

Windows Example - Path must use forward slashes, unquoted, spaces allowed

```sql
SOURCE C:/Users/bissu/gitlab/hybrid-files/schema.sql;
```

### Dev Setup

Make sure you're in the app sub-directory

```bash
$ cd app/
```

Install required packages

```bash
$ npm install
```

To run the dev build

```bash
$ npm run dev
```

To build for production

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```


### Assignment SQL Requirements

| # | Description | Statisfying Area |
| ----------- | ----------- | ------ |
| 1 | Print/display records from your database/tables | All Pages |
| 2 | Query for data/results with various parameters/filters | File Filters |
| 3 | Create a new record | All pages |
| 4 | Delete records (soft delete function would be ideal) | All Pages |
| 5 | Update records | All Pages |
| 6 | Make use of transactions (commit & rollback) | Insert File |
| 7 | Generate reports that can be exported (excel or csv format) | N/A |
| 8 | One query must perform an aggregation/group-by clause | User Groups |
| 9 | One query must contain a subquery | N/A |
| 10 | Two queries must involve joins across at least 3 tables | Views |
| 11 | Enforce referential integrality (PK/FK Constraints) | Satisfied |
| 12 | Include Database Views, Indexes | User Groups View |
| 13 | Use at least 5 entities | Satisfied |



# Development Mentions

- `group` and `file` turned out to be reserved keywords and provided some trouble when creating tables with those names