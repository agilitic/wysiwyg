module Wysiwyg
  class Picture < ActiveRecord::Base
    set_table_name 'wysiwyg_pictures'
    
    has_attached_file :file,
      :path => ":rails_root/public/system/w_pictures/:id/:style.:extension",
      :url  => "/system/w_pictures/:id/:style.:extension",
      :styles => { :medium => "300x300>",
        :thumb => "100x75>",
        :slideshow => "300x200>"
    }

    validates_attachment_presence     :file
    validates_attachment_size         :file, :in => 1..5.megabyte
    validates_attachment_content_type :file,
      :content_type => [ 'image/jpg', 'image/jpeg', 'image/jpe', 'image/png' ]
  end
end