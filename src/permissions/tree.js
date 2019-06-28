/**
 *
 * tree.js
 * 
 * Tree shaped permissions declarations for tree shaped permissions.
 *
 * Write your permissions tree as a regular JavaScript object annotated with Symbol
 * metaproperties providing additional information such as better labels & descriptions.
 *
 * No repetitive typing of basically identical nodes required.
 *
 * (example.js describes it in JavaScript better than I can in English)
 *
 **/

// I put dollar signs on these property names to denote their uniqueness
// but there is nothing significant about the sigil itself
//
// We're taking advantage of the fact that Symbol property names are not
// enumerable, heckin useful for attaching metadata to a tree structure
const $Label = Symbol();
const $Descr = Symbol();
const $Type = Symbol();

// converts a tree structure to the array structure expected by SV Auth
function Permissions (namespace, tree) {
	return collect(namespace, tree);
}

// classic recursive walk
function collect (breadcrumbs, tree) {
	const perms = [];
	for (const n in tree) {
		const child = tree[n];
		const name = [breadcrumbs, n].join('.');
		const label = child[$Label] || formatLabel(n);
		const description = child[$Descr] || label + ' Permissions';
		const permType = child[$Type];

		const perm = { name, label };
		if (permType) {
			perm.permType = permType;
		} else {
			perm.description = description;
		}

		perms.push(perm);

		const subPerms = collect(name, child);
		[].push.apply(perms, subPerms);
	}
	return perms;
}

// (snake case => title case)
function formatLabel (name) {
	const words = name.split('_');
	const titlecased = words.map(word => word[0].toUpperCase() + word.slice(1));
	return titlecased.join(' ');
}

// leaf node constructors for custom permission "types" (labels)
function ReadPerm (label = 'Read') {
	return {
		[$Label]: label,
		[$Type]: 'read'
	};
}

function WritePerm (label = 'Write') {
	return {
		[$Label]: label,
		[$Type]: 'write'
	};
}

function RemovePerm (label = 'Remove') {
	return {
		[$Label]: label,
		[$Type]: 'remove'
	};
}

// or they come prerolled for convenience
const read = ReadPerm();
const write = WritePerm();
const remove = RemovePerm();

module.exports = {
	Meta: {
		$Label,
		$Descr,
		$Type
	},
	Permissions,
	Leaves: {
		ReadPerm,
		WritePerm,
		RemovePerm,
		read,
		write,
		remove
	}
};
