class Releaserun < Formula
  desc "Scan dependency files for EOL status, CVEs, and health grade"
  homepage "https://releaserun.com"
  url "https://registry.npmjs.org/releaserun/-/releaserun-1.0.0.tgz"
  sha256 "1e333af4882a14a28de589fca890631bfd598b09821d49d63f4c26dea0328aad"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]

    (bin/"releaserun").write <<~EOS
      #!/bin/bash
      exec "#{Formula["node"].opt_bin}/node" "#{libexec}/dist/index.js" "$@"
    EOS
  end

  test do
    output = shell_output("#{bin}/releaserun --version")
    assert_match "1.0.0", output
  end
end
