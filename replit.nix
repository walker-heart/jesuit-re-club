{pkgs}: {
  deps = [
    pkgs.firebase-tools
    pkgs.uwhoisd
    pkgs.openssh
    pkgs.postgresql
    pkgs.lsof
  ];
}
