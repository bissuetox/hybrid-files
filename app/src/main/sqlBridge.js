// const mysql = require('mysql2')
import mysql from 'mysql2'
var bridge = {
  connected: false,
  con: undefined
}

export const sqlBridge = {
  establishCon: async (payload) => {
    return new Promise((resolve, reject) => {
      try {
        // Attempt to make connection
        const con = mysql.createConnection({
          host: payload.host,
          database: payload.database,
          user: payload.username,
          password: payload.password,
          multipleStatements: true // Dangerous - temporary use!
        })

        // https://stackoverflow.com/questions/59478692/date-mismatch-in-database-when-queried-by-node-script

        // On connect event
        con.connect((err) => {
          // Handle
          if (err) {
            var msg
            if (err.errno === -4078) {
              msg = 'MySQL Server is not online. Make sure the service is running!'
            } else {
              msg = err.message
            }
            const res = {
              success: false,
              msg: msg
            }
            bridge.con = undefined
            bridge.connected = false
            resolve(res)
          }
          // Success
          else {
            const res = {
              success: true,
              msg: 'Connection Success'
            }
            bridge.con = con
            bridge.connected = true
            resolve(res)
          }
        })
      } catch (err) {
        const res = {
          success: false,
          msg: err.msg
        }
        bridge.con = undefined
        bridge.connected = false
        reject(res)
      }
    })
  },
  validateUser: async (payload) => {
    const query = `
    SELECT username
    FROM \`user\`
    WHERE username='${payload.username}'
    AND password='${payload.password}';
    `
    return GETQueryPromise(query)
  },
  getPlatforms: async (payload) => {
    const query = `
    SELECT *
    FROM platform;
    `
    return GETQueryPromise(query)
  },
  getLocalPlatforms: async (payload) => {
    const query = `
    SELECT *
    FROM platform
    WHERE \`type\`='${payload.type}'
    `
    return GETQueryPromise(query)
  },
  editPlatform: async (payload) => {
    const query = `
    UPDATE platform
    SET \`name\` = '${payload.name}',
        \`type\`= '${payload.type}',
        \`schema\` = '${payload.schema}',
        \`status\` = '${payload.status}'
    WHERE platform_id = ${payload.platform_id}
    `
    return PUTQueryPromise(query)
  },
  insertPlatform: async (payload) => {
    const query = `
    INSERT INTO platform (\`name\`, \`type\`, \`schema\`, status)
    VALUES ('${payload.name}', '${payload.type}', '${payload.schema}', '${payload.status}');
    `
    return PUTQueryPromise(query)
  },
  deletePlatform: async (payload) => {
    const query = `
      DELETE FROM platform
      WHERE platform_id='${payload.platform_id}'
    `
    return DELETEQueryPromise(query)
  },
  getUsers: async (payload) => {
    const query = `
    SELECT *
    FROM user;
    `
    return GETQueryPromise(query)
  },
  getUserGroups: async (payload) => {
    const query = `
    SELECT *
    FROM user_group_info;
    `
    var groupsRes = await GETQueryPromise(query)
    // Return if original fetch fails
    if (!groupsRes.success) {
      return new Promise((resolve) => {
        resolve(groupsRes)
      })
    }

    var newData = {}
    // Otherwise aggregate groups into user data
    groupsRes.data.forEach((row, idx) => {
      // If newData object has no user_id entries yet, init with group key
      if (!Object.prototype.hasOwnProperty.call(newData, row.user_id)) {
        newData[row.user_id] = {
          user_id: row.user_id,
          username: row.username,
          password: row.password,
          groups: []
        }
      }
      // If group id match found (Left Join)
      if (row.user_group_id) {
        newData[row.user_id].groups.push({
          user_group_id: row.user_group_id,
          group_id: row.group_id,
          group_name: row.group_name,
          group_description: row.group_description
        })
      }

    })

    // Convert to array of objects
    newData = Object.values(newData).map(obj => {
      return { ...obj };
    });
    var newRes = groupsRes
    newRes.data = newData

    return new Promise((resolve) => {
      resolve(newRes)
    })
  },
  getUserGroupsByUser: async (payload) => {
    const query = `
    SELECT *
    FROM user_group_info;
    `
    return GETQueryPromise(query)
  },
  editUser: async (payload) => {
    const query = `
    UPDATE user
    SET \`username\` = '${payload.username}',
        \`password\`= '${payload.password}'
    WHERE user_id = ${payload.user_id}
    `
    return PUTQueryPromise(query)
  },
  insertUser: async (payload) => {
    const query = `
    INSERT INTO user (username, password)
    VALUES ('${payload.username}', '${payload.password}');
    `
    return PUTQueryPromise(query)
  },
  deleteUser: async (payload) => {
    // Hardcode protect user 1 from deletion
    if (parseInt(payload.user_id) === 1) {
      return new Promise((resolve) => {
        resolve({
          success: false,
          errMsg: "Cannot delete admin user!"
        })
      })
    }
    const query = `
      DELETE FROM user
      WHERE user_id='${payload.user_id}'
    `
    return DELETEQueryPromise(query)
  },
  getGroups: async (payload) => {
    const query = `
    SELECT *
    FROM \`group\`;
    `
    return GETQueryPromise(query)
  },
  editGroup: async (payload) => {
    const query = `
    UPDATE \`group\`
    SET \`name\` = '${payload.name}',
        \`description\`= '${payload.description}'
    WHERE group_id = ${payload.group_id}
    `
    return PUTQueryPromise(query)
  },
  insertGroup: async (payload) => {
    const query = `
    INSERT INTO \`group\` (name, description)
    VALUES ('${payload.name}', '${payload.description}');
    `
    return PUTQueryPromise(query)
  },
  deleteGroup: async (payload) => {
    // Hardcode protect group 1 from deletion
    if (parseInt(payload.group_id) === 1) {
      return new Promise((resolve) => {
        resolve({
          success: false,
          errMsg: "Cannot delete admin group!"
        })
      })
    }
    const query = `
      DELETE FROM \`group\`
      WHERE group_id='${payload.group_id}'
    `
    return DELETEQueryPromise(query)
  },
  getJobs: async (payload) => {
    const query = `
    SELECT *
    FROM job;
    `
    return GETQueryPromise(query)
  },
  insertJob: async (payload) => {
    return orchestrateFileJob(payload)
  },
  runJob: async (payload) => {
    var fileInsertsList = payload.fileList.map((f) => {
      return `(@job_id, '${payload.src_platform}', '${f.name}', '${f.fullPath}', '${f.size}', '${f.createdTime}', '${f.modifiedTime}')`
    })
    var fileInsertsStr = fileInsertsList.join(', ')
  },
  deleteJob: async (payload) => {
    const query = `
      DELETE FROM job
      WHERE job_id='${payload.job_id}'
    `
    return DELETEQueryPromise(query)
  },
  getFiles: async (payload) => {
    const where = whereFilters(payload.tableConfig)
    const limits = paginationLimits(payload.tableConfig)
    const query = `
    SELECT *
    FROM file
    ${where}
    ${limits};
    `
    const totalFilesRes = await GETQueryPromise(`
      SELECT COUNT(*) as rowCount
      FROM file
      ${where}
    `)
    const rowCount = totalFilesRes.data[0]['rowCount']
    const filesRes = await GETQueryPromise(query)
    return new Promise((resolve) => {
      resolve({
        success: true,
        data: {
          totalRows: rowCount,
          fileList: filesRes.data
        }
      })
    })
  },
}

// Resolves promise regardless - pivot on successs & errMsg
const DELETEQueryPromise = (query) => {
  return new Promise((resolve, reject) => {
    var res = {
      success: false,
      errMsg: '',
      data: []
    }
    if (!bridge.connected) {
      res.success = false
      res.errMsg = 'Connection not established!'
      resolve(res)
    }
    try {
      bridge.con.query(query, (err) => {
        if (err) {
          res.success = false
          res.errMsg = err.message
        } else {
          res.success = true
        }
        resolve(res)
      })
    } catch (e) {
      res.success = false
      res.errMsg = e.message
      resolve(res)
    }
  })
}

const GETQueryPromise = (query, successCallback) => {
  return new Promise((resolve, reject) => {
    var res = {
      success: false,
      errMsg: '',
      data: []
    }
    if (!bridge.connected) {
      res.success = false
      res.errMsg = 'Connection not established!'
      resolve(res)
    }
    try {
      bridge.con.query(query, (err, data) => {
        if (err) {
          res.success = false
          res.errMsg = err.message
        } else {
          res.success = true
          res.data = data
          successCallback && successCallback(res)
        }
        resolve(res)
      })
    } catch (e) {
      res.success = false
      res.errMsg = e.message
      resolve(res)
    }
  })
}

const PUTQueryPromise = (query, successCallback) => {
  return new Promise((resolve, reject) => {
    var res = {
      success: false,
      errMsg: '',
    }
    if (!bridge.connected) {
      res.success = false
      res.errMsg = 'Connection not established!'
      resolve(res)
    }
    try {
      bridge.con.query(query, (err, data) => {
        if (err) {
          res.success = false
          res.errMsg = err.message
        } else {
          res.success = true
          successCallback && successCallback(res)
        }
        resolve(res)
      })
    } catch (e) {
      res.success = false
      res.errMsg = e.message
      resolve(res)
    }
  })
}

const orchestrateFileJob = (payload) => {
  const jobQuery = `
    INSERT INTO job (name, type, status, src_path, src_platform, date_started, date_finished)
    VALUES (
    '${payload.name}', 
    '${payload.type}', 
    '${payload.status}', 
    '${doubleSlash(payload.src_path)}', 
    '${payload.src_platform}', 
    '${sqlDateFormat(payload.date_started)}', 
    '${sqlDateFormat(payload.date_finished)}'
  );`

  return new Promise((resolve) => {
    var res = {
      success: false,
      errMsg: ''
    }
    if (!bridge.connected) {
      res.success = false
      res.errMsg = 'Connection not established!'
      resolve(res)
    }
    try {
      // Start Transaction
      const chainSuccess = []
      bridge.con.beginTransaction(async (err) => {
        if (err) {
          res.success = false
          res.errMsg = err.message
          resolve(res)
        }
        // Insert Job
        const jobRes = await GETQueryPromise(jobQuery)
        if (!jobRes.success) {
          bridge.con.rollback()
          resolve(jobRes)
          return
        }
        const job_id = jobRes.data.insertId

        var insertQuery = ''
        payload.fileList.forEach((fileRow) => {
          insertQuery += `
            CALL insert_file(
            ${job_id},
            ${payload.src_platform},
            ${payload.job_group},
            '${fileRow.name}',
            '${doubleSlash(fileRow.fullPath)}',
            '${fileRow.extName}',
            ${fileRow.size},
            '${sqlDateFormat(fileRow.createdTime)}',
            '${sqlDateFormat(fileRow.modifiedTime)}'
          );`
        })

        // Insert files
        const filesRes = await PUTQueryPromise(insertQuery)
        if (!filesRes.success) {
          console.log(filesRes.errMsg)
          bridge.con.rollback()
          resolve(filesRes)
          return
        }

        // Commit assuming all success and no returns
        console.log('committing file inserts!')
        bridge.con.commit()
        resolve(filesRes)
      })
    } catch (e) {
      res.success = false
      res.errMsg = e.message
      resolve(res)
    }
  })
}

const sqlDateFormat = (dateStr) => {
  return new Date(dateStr).toISOString().slice(0, 19).replace('T', ' ');
}

const doubleSlash = (str) => {
  return str.replace(/(.)(\\)(.)/g, function (match, before, backslash, after) {
    // Check if the backslash is surrounded by characters
    if (before.trim().length > 0 && after.trim().length > 0) {
      return before + '\\\\' + after;
    } else {
      return match; // No surrounding characters, return the original match
    }
  });
}

const whereFilters = (filters) => {
  var atleastOne = false
  var where = 'WHERE '
  if (filters.filterName !== '') {
    where += `${atleastOne ? ' AND ' : ''} name LIKE '%${filters.filterName}%'`
    atleastOne = true
  }
  if (filters.filterExtension !== '') {
    where += `${atleastOne ? ' AND ' : ''} extension LIKE '%${filters.filterExtension}%'`
    atleastOne = true
  }
  // Return blank if no filters given
  return atleastOne ? where : ''
}

const paginationLimits = (c) => {
  const limit = c.rows
  const offset = (c.page - 1) * c.rows
  // Page 1, 20 rows, offset = (1 - 0) * 20 = 0
  // Page 2, 20 rows, offset (2 - 1) * 20 = 20
  return `LIMIT ${limit} OFFSET ${offset}`
}