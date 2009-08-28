namespace :wysiwyg do
  desc 'Copy needed assets to public folder'
  task :copy_assets do
    `mkdir -p public/wysiwyg`
    `mkdir -p public/wysiwyg/images`
    `cp -f vendor/plugins/wysiwyg/public/wysiwyg/wysiwyg.js public/wysiwyg/wysiwyg.js`
    `cp -f vendor/plugins/wysiwyg/public/wysiwyg/wysiwyg.css public/wysiwyg/wysiwyg.css`
    `cp -f vendor/plugins/wysiwyg/public/wysiwyg/images/rte_colorpicker_gray.jpg public/wysiwyg/images/rte_colorpicker_gray.jpg`
    `cp -f vendor/plugins/wysiwyg/public/wysiwyg/images/rte_colorpicker_rgb.jpg public/wysiwyg/images/rte_colorpicker_rgb.jpg`
    `cp -f vendor/plugins/wysiwyg/public/wysiwyg/images/rte_icons.gif public/wysiwyg/images/rte_icons.gif`
    puts "Needed assets copied to public folder"
  end
end