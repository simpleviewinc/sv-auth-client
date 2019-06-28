const { 
	Meta: { $Label, $Descr },
	Permissions,
	Leaves: { ReadPerm, WritePerm, RemovePerm, read, write, remove }
} = require('./tree');

// extra spicy permissions we roll ourselves
const exec = ReadPerm('Execute');
const hide = WritePerm('Hide');
const disable = RemovePerm('Disable');

// tree shaped declarations for tree shaped permissions!
const permissionsTree = {
	admin: {
		[$Label]: 'Administration',
		[$Descr]: 'Powerful Permissions for Professionals Only',
		database_connection: {
			// object property shorthand ftw!
			read,
			write,
			disable
		},
		// [$Label] and [$Descr] are optional
		// They'll get generated from your snake cased property names if not supplied.
		// name: database_map => label: Database Map => description: Database Map Permissions
		database_map: {
			read,
			write,
			disable
		},
		model: {
			read,
			write,
			exec,
			hide,
			disable
		},
		table: {
			[$Descr]: 'Tables and Views',
			read,
			write,
			hide,
			disable
		},
	},
	standard_access: {
		[$Descr]: 'Ordinary Permissions for Ordinary Users',
		database_map: {
			read
		},
		model: {
			read,
			exec
		},
		table: {
			read
		}
	},
	reporting: {
		[$Descr]: 'Permissions for Reports',
		report_def: {
			[$Label]: 'Report Definition',
			read,
			write,
			remove
		},
		run_report: {
			exec
		}
	}
};

module.exports = Permissions(permissionsTree);
