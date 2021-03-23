file_perms=--allow-read=output --allow-write=output

output/metadata.sql:
	deno run --import-map=import_map.json --allow-net=gist.githubusercontent.com $(file_perms) src/main.ts ${VERBOSE}

clean:
	rm -rf output

.PHONY: clean
