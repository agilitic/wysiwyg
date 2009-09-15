class WPicturesGenerator < Rails::Generator::Base 
  def manifest 
    record do |m|
      
      # assets 
      m.directory "public/wysiwyg"
      m.directory "public/wysiwyg/images"
      m.file "public/wysiwyg.js", "public/wysiwyg/wysiwyg.js"
      m.file "public/wysiwyg.css", "public/wysiwyg/wysiwyg.css" 
      m.file "public/images/rte_colorpicker_gray.jpg", "public/wysiwyg/images/rte_colorpicker_gray.jpg"
      m.file "public/images/rte_colorpicker_rgb.jpg", "public/wysiwyg/images/rte_colorpicker_rgb.jpg"
      m.file "public/images/rte_icons.gif", "public/wysiwyg/images/rte_icons.gif"
      
      # controller & model
      m.file "controllers/w_pictures_controller.rb", "app/controllers/w_pictures_controller.rb"
      m.file "models/w_pictures.rb", "app/models/w_pictures.rb"
      
      # routes & migrations
      m.route_resources :w_pictures
      m.migration_template "create_wysiwyg_pictures.rb", "db/migrate"             
    end
  end
  
  def file_name
      "create_wysiwyg_pictures"
    end
  
end 