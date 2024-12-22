{pkgs}: {
  deps = [
    pkgs.uwhoisd
    pkgs.openssh
    pkgs.postgresql
    pkgs.lsof
  ];
}
