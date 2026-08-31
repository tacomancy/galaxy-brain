#!/usr/bin/env bash

set +e

log_path="$1"
shift

"$@" 2>&1 | tee "$log_path"
status=${PIPESTATUS[0]}
exit "$status"
