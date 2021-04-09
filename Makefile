import_map=--import-map=import_map.json
file_perms=--allow-read=tmp,output,data --allow-write=tmp,output

output/metadata.sql:
	deno run --unstable $(import_map) --allow-net=gist.githubusercontent.com $(file_perms) src/main.ts ${VERBOSE}

clean:
	rm -rf output

test:
	deno test --unstable $(import_map) src

test-watch:
	watchexec --exts ts make test

.PHONY: clean test test-debug test-watch
